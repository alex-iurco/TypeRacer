// Common interface for all AI providers
export interface AIProvider {
  generateQuotes(prompt: string): Promise<string[]>;
}
