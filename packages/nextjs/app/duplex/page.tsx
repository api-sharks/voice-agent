'use client';

import { ThemeProvider } from '@pipecat-ai/voice-ui-kit';
import { VoiceChatDuplex } from '@/components/VoiceChatDuplex';

export default function DuplexPage() {
  return (
    <ThemeProvider>
      <div className="w-full h-dvh bg-background">
        <VoiceChatDuplex />
      </div>
    </ThemeProvider>
  );
}
