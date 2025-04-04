import { calculateWPM, calculateAccuracy } from '../../utils/gameLogic';

describe('Game Logic Utils', () => {
  describe('calculateWPM', () => {
    it('should calculate WPM correctly', () => {
      const typedChars = 10; // 2 words (5 chars per word)
      const timeInMinutes = 1; // 1 minute
      const wpm = calculateWPM(typedChars, timeInMinutes);
      expect(wpm).toBe(2); // 2 words per minute
    });

    it('should return 0 for zero time', () => {
      expect(calculateWPM(10, 0)).toBe(0);
    });
  });

  describe('calculateAccuracy', () => {
    it('should calculate 100% accuracy for perfect match', () => {
      const correctChars = 4;
      const totalChars = 4;
      expect(calculateAccuracy(correctChars, totalChars)).toBe(100);
    });

    it('should calculate 50% accuracy for half correct', () => {
      const correctChars = 2;
      const totalChars = 4;
      expect(calculateAccuracy(correctChars, totalChars)).toBe(50);
    });

    it('should calculate 0% accuracy for no correct chars', () => {
      const correctChars = 0;
      const totalChars = 4;
      expect(calculateAccuracy(correctChars, totalChars)).toBe(0);
    });

    it('should handle zero total chars', () => {
      const correctChars = 0;
      const totalChars = 0;
      expect(calculateAccuracy(correctChars, totalChars)).toBe(100);
    });
  });
}); 