import { useState, useRef } from 'react';

/**
 * Custom hook to calculate and manage typing progress
 * @param {Function} onProgress - Callback function to report progress
 * @returns {Object} - Progress state and related functions
 */
const useProgressCalculation = (onProgress) => {
  const [progress, setProgress] = useState(0);
  const lastProgressRef = useRef(0);
  
  /**
   * Calculate progress based on completed words and current input
   * @param {string[]} words - Array of all words in the text
   * @param {number} currentWordIndex - Index of the current word
   * @param {string} currentWord - Current word being typed
   * @param {string} input - Current input for the current word
   * @param {boolean} isCompleted - Whether the typing is completed
   * @returns {number} - Progress percentage (0-100)
   */
  const calculateProgress = (words, currentWordIndex, currentWord, input, isCompleted) => {
    if (!words || words.length === 0) return 0;
    if (isCompleted) return 100;
    
    const fullText = words.join(' ');
    
    // Calculate total characters in completed words including spaces
    const completedWords = words.slice(0, currentWordIndex);
    let totalCorrectChars = completedWords.join(' ').length;
    if (currentWordIndex > 0) {
      // Add space for each completed word except the last one
      totalCorrectChars += 1;
    }
    
    // Add correct characters from current word
    if (input) {
      for (let i = 0; i < input.length && i < currentWord.length; i++) {
        if (input[i] === currentWord[i]) {
          totalCorrectChars++;
        } else {
          break;
        }
      }
    }
    
    // Calculate progress percentage based on total characters including spaces
    const totalChars = fullText.length;
    const progressPercent = Math.min(100, Math.round((totalCorrectChars / totalChars) * 100));
    return progressPercent;
  };
  
  /**
   * Update progress and trigger the onProgress callback if significant change
   * @param {number} newProgress - New progress value
   * @param {string} input - Current input
   * @param {number} wpm - Current WPM
   */
  const updateProgress = (newProgress, input, wpm) => {
    setProgress(newProgress);
    
    // Only emit progress update on significant progress change (at least 1%)
    if (Math.abs(newProgress - lastProgressRef.current) >= 1) {
      lastProgressRef.current = newProgress;
      if (onProgress) {
        onProgress(newProgress, input, wpm);
      }
    }
  };
  
  /**
   * Set progress to 100% (completed)
   * @param {string} input - Final input
   * @param {number} wpm - Final WPM
   */
  const completeProgress = (input, wpm) => {
    const finalProgress = 100;
    setProgress(finalProgress);
    lastProgressRef.current = finalProgress;
    if (onProgress) {
      onProgress(finalProgress, input, wpm);
    }
  };
  
  /**
   * Reset progress to 0
   */
  const resetProgress = () => {
    setProgress(0);
    lastProgressRef.current = 0;
  };
  
  return {
    progress,
    calculateProgress,
    updateProgress,
    completeProgress,
    resetProgress,
    lastProgressRef
  };
};

export default useProgressCalculation; 