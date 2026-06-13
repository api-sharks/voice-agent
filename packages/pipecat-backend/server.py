import asyncio
import json
import logging
import os
from typing import Optional

import aiohttp
from dotenv import load_dotenv
from pipecat.audio.vad import SileroVADAnalyzer
from pipecat.frames.frames import (
    AudioRawFrame,
    BotInterruptionFrame,
    LLMMessagesFrame,
    TextFrame,
    TranscriptionFrame,
    UserStoppedSpeakingFrame,
)
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.processors.aggregators.llm_response import (
    LLMAssistantResponseAggregator,
)
from pipecat.processors.frame_processor import FrameProcessor
from pipecat.processors.text_to_speech import TextToSpeechProcessor
from pipecat.services.elevenlabs import ElevenLabsService
from pipecat.services.openai import OpenAILLMService, OpenAIWhisperService
from pipecat.transports.services.bot_service import BotService
from pipecat.transports.services.daily import DailyService
from pipecat.transports.transports.daily_transport import DailyTransport

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class WebSocketTransport(BotService):
    """WebSocket transport for browser-based voice conversations."""

    def __init__(self, host: str = "localhost", port: int = 8765):
        super().__init__()
        self.host = host
        self.port = port
        self.server = None
        self.clients = set()

    async def start(self):
        """Start WebSocket server."""
        async def handler(websocket, path):
            self.clients.add(websocket)
            try:
                async for message in websocket:
                    await self.handle_message(websocket, message)
            finally:
                self.clients.remove(websocket)

        self.server = await asyncio.get_event_loop().create_server(
            lambda: asyncio.Protocol(),
            self.host,
            self.port,
        )
        logger.info(f"WebSocket server started on ws://{self.host}:{self.port}")

    async def handle_message(self, websocket, message: str):
        """Handle incoming WebSocket messages."""
        try:
            data = json.loads(message)
            message_type = data.get("type")

            if message_type == "audio":
                # Handle audio frame from client
                await self.push_frame(AudioRawFrame(data=bytes(data["data"])))
            elif message_type == "interrupt":
                # Handle user interruption
                await self.push_frame(BotInterruptionFrame())
        except Exception as e:
            logger.error(f"Error handling message: {e}")

    async def send_frame(self, frame):
        """Send frame to all connected clients."""
        if isinstance(frame, TextFrame):
            message = {
                "type": "text",
                "text": frame.text,
            }
            await self.broadcast(json.dumps(message))
        elif isinstance(frame, TranscriptionFrame):
            message = {
                "type": "transcription",
                "text": frame.text,
            }
            await self.broadcast(json.dumps(message))

    async def broadcast(self, message: str):
        """Broadcast message to all connected clients."""
        if self.clients:
            await asyncio.gather(
                *[client.send(message) for client in self.clients],
                return_exceptions=True,
            )


async def create_pipeline() -> Pipeline:
    """Create Pipecat conversation pipeline."""

    # Initialize services
    whisper = OpenAIWhisperService(
        api_key=os.getenv("OPENAI_API_KEY"),
        model="whisper-1",
    )

    llm = OpenAILLMService(
        api_key=os.getenv("OPENAI_API_KEY"),
        model="gpt-4",
    )

    tts = ElevenLabsService(
        api_key=os.getenv("ELEVENLABS_API_KEY"),
        voice_id="21m00Tcm4TlvDq8ikWAM",
    )

    # Create VAD analyzer
    vad = SileroVADAnalyzer()

    # Create response aggregator
    response_aggregator = LLMAssistantResponseAggregator()

    # Create pipeline
    pipeline = Pipeline(
        [
            whisper,
            vad,
            llm,
            response_aggregator,
            tts,
        ]
    )

    return pipeline


async def main():
    """Main server entry point."""
    transport = WebSocketTransport(host="0.0.0.0", port=8765)
    pipeline = await create_pipeline()

    runner = PipelineRunner()

    try:
        await transport.start()
        # Run pipeline with transport
        await runner.run(pipeline)
    except KeyboardInterrupt:
        logger.info("Server shutting down...")
    finally:
        await runner.stop()


if __name__ == "__main__":
    asyncio.run(main())
