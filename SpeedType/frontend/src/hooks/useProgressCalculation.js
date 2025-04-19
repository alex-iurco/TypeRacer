import { useState, useRef, useCallback } from 'react';

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
    const totalChars = fullText.length;
    let totalCorrectChars = 0;

    if (currentWordIndex > 0) {
        // Calculate length of all completed words + spaces BETWEEN them
        const completedWordsBlock = words.slice(0, currentWordIndex).join(' ');
        totalCorrectChars = completedWordsBlock.length;
        // Add the single space AFTER the completed block
        totalCorrectChars += 1;
    }
    
    // If we are calculating progress for the current word (input is not empty)
    // Add correctly typed characters from the CURRENT word
    if (input && currentWord) { // Added check for currentWord
      for (let i = 0; i < input.length && i < currentWord.length; i++) {
        if (input[i] === currentWord[i]) {
          totalCorrectChars++;
        } else {
          break;
        }
      }
    }
    // If input is empty, totalCorrectChars remains just the length of completed words + spaces
    
    // Calculate progress percentage based on total characters including spaces
    // Added check for totalChars > 0 to prevent NaN
    const progressPercent = totalChars > 0 ? Math.min(100, Math.round((totalCorrectChars / totalChars) * 100)) : 0;
    return progressPercent;
  };
  
  /**
   * Update progress and trigger the onProgress callback if significant change
   * @param {number} newProgress - New progress value
   * @param {string} input - Current input
   */
  const updateProgress = useCallback((newProgress, input) => {
    setProgress(newProgress);
    
    // Only emit progress update on significant progress change (at least 1%)
    if (Math.abs(newProgress - lastProgressRef.current) >= 1) {
      lastProgressRef.current = newProgress;
      if (onProgress) {
        onProgress(newProgress, input);
      }
    }
  }, [onProgress]);
  
  /**
   * Set progress to 100% (completed)
   * @param {string} input - Final input
   */
  const completeProgress = useCallback((input) => {
    const finalProgress = 100;
    setProgress(finalProgress);
    lastProgressRef.current = finalProgress;
    if (onProgress) {
      onProgress(finalProgress, input);
    }
  }, [onProgress]);
  
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