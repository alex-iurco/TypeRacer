export const calculateWPM = (typedChars: number, timeInMinutes: number): number => {
  if (timeInMinutes === 0) return 0;
  return Math.round((typedChars / 5) / timeInMinutes);
};

export const validateInput = (input: string, target: string): boolean => {
  return input === target;
};

export const calculateAccuracy = (correctChars: number, totalChars: number): number => {
  if (totalChars === 0) return 100;
  return Math.round((correctChars / totalChars) * 100);
}; 