import { calculateWPM, validateInput, calculateAccuracy } from '../../utils/gameLogic';

describe('Game Logic', () => {
  describe('calculateWPM', () => {
    it('calculates WPM correctly for perfect typing', () => {
      const text = 'the quick brown fox';
      const timeInMs = 12000; // 12 seconds
      
      const wpm = calculateWPM(text, text, timeInMs);
      
      // 4 words in 12 seconds = 20 WPM
      expect(wpm).toBe(20);
    });

    it('returns 0 for empty input', () => {
      expect(calculateWPM('test text', '', 1000)).toBe(0);
    });

    it('throws error for invalid time', () => {
      expect(() => calculateWPM('test', 'test', 0)).toThrow();
    });
  });

  describe('validateInput', () => {
    it('validates correct input', () => {
      expect(validateInput('test', 'test')).toBe(true);
    });

    it('validates partial correct input', () => {
      expect(validateInput('test', 'te')).toBe(true);
    });

    it('invalidates incorrect input', () => {
      expect(validateInput('test', 'tex')).toBe(false);
    });
  });

  describe('calculateAccuracy', () => {
    it('calculates 100% accuracy for perfect match', () => {
      expect(calculateAccuracy('test', 'test')).toBe(100);
    });

    it('calculates partial accuracy', () => {
      expect(calculateAccuracy('test', 'te')).toBe(50);
    });

    it('calculates 0% accuracy for completely wrong input', () => {
      expect(calculateAccuracy('test', 'xxxx')).toBe(0);
    });

    it('handles empty input', () => {
      expect(calculateAccuracy('test', '')).toBe(0);
    });
  });
}); 