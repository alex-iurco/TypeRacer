/**
 * Calculate words per minute (WPM) based on typed characters and time
 * @param typedChars Number of characters typed
 * @param timeInMinutes Time taken in minutes
 * @returns Words per minute
 */
export const calculateWPM = (typedChars: number, timeInMinutes: number): number => {
  if (timeInMinutes === 0) return 0;
  // Assuming average word length of 5 characters
  const words = typedChars / 5;
  return Math.round(words / timeInMinutes);
};

/**
 * Calculate typing accuracy as a percentage
 * @param correctChars Number of correctly typed characters
 * @param totalChars Total number of characters
 * @returns Accuracy percentage
 */
export const calculateAccuracy = (correctChars: number, totalChars: number): number => {
  if (totalChars === 0) return 100;
  return Math.round((correctChars / totalChars) * 100);
}; 