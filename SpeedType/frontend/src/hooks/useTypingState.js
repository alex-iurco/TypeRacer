import { useState, useRef, useEffect } from 'react';

/**
 * Custom hook to manage typing state
 * @param {string} textToType - The text that the user needs to type
 * @returns {Object} - Typing state and related functions
 */
const useTypingState = (textToType) => {
  // State for typing
  const [input, setInput] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isError, setIsError] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  
  // Refs for optimization
  const textRef = useRef(textToType);
  
  // Split text into words
  const words = textToType ? textToType.split(' ') : [];
  const currentWord = words[currentWordIndex] || '';
  
  // Update text ref when text changes
  useEffect(() => {
    // Only reset if the text actually changes
    if (textToType !== textRef.current) {
      console.log('Text changed:', textToType);
      textRef.current = textToType;
      
      // Reset state when text changes
      setInput('');
      setCurrentWordIndex(0);
      setIsError(false);
      setIsCompleted(false);
    }
  }, [textToType]);
  
  /**
   * Check if input matches the current word
   * @param {string} newInput - The new input to check
   * @returns {boolean} - Whether the input matches
   */
  const checkInputMatch = (newInput) => {
    return currentWord.startsWith(newInput);
  };
  
  /**
   * Handle word completion and move to next word
   */
  const completeWord = () => {
    if (currentWordIndex === words.length - 1) {
      // Last word completed
      setIsCompleted(true);
      return true;
    } else {
      // Move to next word
      setCurrentWordIndex(prev => prev + 1);
      setInput('');
      setIsError(false);
      return false;
    }
  };
  
  /**
   * Reset all typing state
   */
  const resetTypingState = () => {
    setInput('');
    setCurrentWordIndex(0);
    setIsError(false);
    setIsCompleted(false);
  };
  
  return {
    input,
    setInput,
    currentWordIndex,
    isError,
    setIsError,
    isCompleted,
    setIsCompleted,
    words,
    currentWord,
    checkInputMatch,
    completeWord,
    resetTypingState
  };
};

export default useTypingState; 