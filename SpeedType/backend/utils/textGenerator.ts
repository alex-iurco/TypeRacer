const sampleTexts = [
  "The quick brown fox jumps over the lazy dog.",
  "To be or not to be, that is the question.",
  "All that glitters is not gold.",
  "A journey of a thousand miles begins with a single step.",
  "Actions speak louder than words.",
  "Practice makes perfect.",
  "Where there's a will, there's a way.",
  "Time heals all wounds.",
  "Better late than never.",
  "Knowledge is power."
];

export const generateText = (): string => {
  const randomIndex = Math.floor(Math.random() * sampleTexts.length);
  return sampleTexts[randomIndex];
}; 