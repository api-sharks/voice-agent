'use client';

let engine: any = null;
let engineInitializing = false;

export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class WebLLMService {
  private static instance: WebLLMService;

  private constructor() {}

  static getInstance(): WebLLMService {
    if (!WebLLMService.instance) {
      WebLLMService.instance = new WebLLMService();
    }
    return WebLLMService.instance;
  }

  async initialize(
    modelId: string = 'TinyLlama-1.1B-Chat-v0.4-q4f32_1-MLC',
    onProgress?: (progress: string) => void
  ) {
    if (engine) {
      return engine;
    }

    if (engineInitializing) {
      // Wait for initialization to complete
      while (engineInitializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return engine;
    }

    engineInitializing = true;

    try {
      console.log('Initializing WebLLM engine...');
      const { MLCEngine } = await import('@mlc-ai/web-llm');

      engine = new MLCEngine({
        initProgressCallback: (report: any) => {
          const progress = `${report.text}${report.progress ? ` - ${Math.round(report.progress * 100)}%` : ''}`;
          console.log(progress);
          if (onProgress) {
            onProgress(progress);
          }
        },
      });

      await engine.reload(modelId);
      console.log('WebLLM engine initialized');

      return engine;
    } catch (error) {
      console.error('Failed to initialize WebLLM:', error);
      throw error;
    } finally {
      engineInitializing = false;
    }
  }

  async generateResponse(messages: LLMMessage[], temperature: number = 0.7): Promise<string> {
    if (!engine) {
      throw new Error('WebLLM engine not initialized. Call initialize() first.');
    }

    try {
      const response = await engine.chat.completions.create({
        messages,
        temperature,
        max_tokens: 512,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Failed to generate response:', error);
      throw error;
    }
  }

  async streamResponse(
    messages: LLMMessage[],
    onChunk: (chunk: string) => void,
    temperature: number = 0.7
  ): Promise<void> {
    if (!engine) {
      throw new Error('WebLLM engine not initialized. Call initialize() first.');
    }

    try {
      const response = await engine.chat.completions.create({
        messages,
        temperature,
        max_tokens: 512,
        stream: true,
      });

      for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          onChunk(content);
        }
      }
    } catch (error) {
      console.error('Failed to stream response:', error);
      throw error;
    }
  }

  isInitialized(): boolean {
    return engine !== null && !engineInitializing;
  }

  getEngine(): any {
    return engine;
  }
}

export const webllmService = WebLLMService.getInstance();
