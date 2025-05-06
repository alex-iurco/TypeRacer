import Anthropic from '@anthropic-ai/sdk';
import { AIProvider } from './types';

const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
const model = process.env.AI_QUOTE_MODEL || 'claude-3-haiku-20240307';

const anthropic = anthropicApiKey ? new Anthropic({ apiKey: anthropicApiKey }) : null;

export const ClaudeHaikuProvider: AIProvider = {
  async generateQuotes(prompt: string): Promise<string[]> {
    if (!anthropic) throw new Error('Anthropic client not initialized');
    const msg = await anthropic.messages.create({
      model,
      max_tokens: 2100,
      messages: [{ role: 'user', content: prompt }],
    });
    const firstContentBlock = msg.content?.[0];
    if (!firstContentBlock || firstContentBlock.type !== 'text') {
      throw new Error('Empty or invalid content received from Claude');
    }
    const generatedText = firstContentBlock.text.trim();
    try {
      const jsonMatch = generatedText.match(/(\[.*\])/s);
      let textToParse = generatedText;
      if (jsonMatch && jsonMatch[1]) {
        textToParse = jsonMatch[1];
      }
      const quotes = JSON.parse(textToParse);
      if (!Array.isArray(quotes)) throw new Error('Expected array from Claude');
      return quotes;
    } catch (err) {
      throw new Error('Failed to parse Claude response: ' + (err instanceof Error ? err.message : String(err)));
    }
  }
};
