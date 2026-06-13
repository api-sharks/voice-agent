import { ThemeProvider } from '@pipecat-ai/voice-ui-kit';
import { VoiceChatOffline } from '@/components/VoiceChatOffline';

export default function Home() {
  return (
    <ThemeProvider>
      <div className="w-full h-dvh bg-background">
        <VoiceChatOffline />
      </div>
    </ThemeProvider>
  );
}
