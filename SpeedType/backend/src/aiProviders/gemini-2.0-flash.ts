import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider } from './types';
import logger from '../utils/logger';

const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY;
const model = process.env.AI_QUOTE_MODEL || 'gemini-2.0-flash';

if (!geminiApiKey) {
  logger.warn('[Gemini] GOOGLE_GEMINI_API_KEY is not set. Gemini provider will not work.');
}

const gemini = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

export const Gemini20FlashProvider: AIProvider = {
  async generateQuotes(prompt: string): Promise<string[]> {
    logger.debug(`[Gemini] generateQuotes called with model: ${model}`);
    if (!gemini) {
      logger.error('[Gemini] Gemini client not initialized.');
      throw new Error('Gemini client not initialized');
    }
    try {
      logger.debug(`[Gemini] Sending prompt to Gemini: ${prompt.slice(0, 200)}...`);
      const geminiModel = gemini.getGenerativeModel({ model });
      const result = await geminiModel.generateContent(prompt);
      const response = result.response;
      const generatedText = response.text().trim();
      logger.debug(`[Gemini] Raw response: ${generatedText.slice(0, 500)}...`);
      try {
        const jsonMatch = generatedText.match(/(\[.*\])/s);
        let textToParse = generatedText;
        if (jsonMatch && jsonMatch[1]) {
          textToParse = jsonMatch[1];
        }
        const quotes = JSON.parse(textToParse);
        if (!Array.isArray(quotes)) throw new Error('Expected array from Gemini');
        logger.debug(`[Gemini] Parsed ${quotes.length} quotes from response.`);
        return quotes;
      } catch (err) {
        logger.error('[Gemini] Failed to parse Gemini response:', err, '\nRaw:', generatedText);
        throw new Error('Failed to parse Gemini response: ' + (err instanceof Error ? err.message : String(err)));
      }
    } catch (error) {
      logger.error('[Gemini] Error during Gemini API call:', error);
      throw error;
    }
  }
};
