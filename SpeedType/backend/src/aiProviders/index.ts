import { ClaudeHaikuProvider } from './claude-haiku';
import { Gemini20FlashProvider } from './gemini-2.0-flash';
import { AIProvider } from './types';

const providers: Record<string, AIProvider> = {
  'claude-haiku': ClaudeHaikuProvider,
  'gemini-2.0-flash': Gemini20FlashProvider,
};

export function getAIProvider(name: string): AIProvider | undefined {
  return providers[name];
}
