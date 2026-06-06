import './whisper.js';

let modelPromise;

function getModel() {
  if (!modelPromise) {
    postMessage({ type: 'status', status: 'Loading Whisper model...' });
    modelPromise = self.whisper.loadModel();
  }

  return modelPromise;
}

self.onmessage = async (event) => {
  try {
    const model = await getModel();
    const result = await model.transcribe(event.data);
    postMessage({ type: 'transcript', text: result.text });
    postMessage({ type: 'status', status: 'Transcript updated.' });
  } catch (error) {
    postMessage({
      type: 'status',
      status: error instanceof Error ? error.message : 'Transcription failed.'
    });
  }
};
