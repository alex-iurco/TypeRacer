import { useState, useRef, useEffect } from 'react';

/**
 * Custom hook to calculate and manage WPM
 * @param {function} onProgress - Callback to report progress with WPM
 * @param {boolean} isStarted - Whether the race has started
 * @param {boolean} isCompleted - Whether the race is completed
 * @returns {Object} - WPM state and related functions
 */
const useWpmCalculation = (onProgress, isStarted, isCompleted) => {
  const [wpm, setWpm] = useState(0);
  const [startTime, setStartTime] = useState(null);
  
  const lastWpmUpdateRef = useRef(null);
  const lastUpdateTimeRef = useRef(null);
  const lastValidWpmRef = useRef(0);
  
  // Reference to last progress value - will be updated from TypingArea
  const lastProgressRef = useRef(null);
  
  // Set start time when race starts
  useEffect(() => {
    console.log('Race started:', isStarted);
    if (isStarted && !startTime) {
      setStartTime(Date.now());
      lastUpdateTimeRef.current = Date.now();
    }
  }, [isStarted, startTime]);
  
  // WPM calculation interval
  useEffect(() => {
    if (!startTime) return;
    if (!isStarted && !isCompleted) return;
    if (isCompleted) return;

    const interval = setInterval(() => {
      if (isCompleted) {
        clearInterval(interval);
        return;
      }
      
      const currentWPM = calculateWPM();
      setWpm(currentWPM);
      
      // Send updates periodically
      if (lastProgressRef.current !== null && onProgress) {
        // Only send periodic updates if there's a significant change or every 2 seconds
        if (!lastWpmUpdateRef.current || 
            Math.abs(currentWPM - lastWpmUpdateRef.current) > 5 || 
            Date.now() - lastUpdateTimeRef.current > 2000) {
          lastWpmUpdateRef.current = currentWPM;
          lastUpdateTimeRef.current = Date.now();
          onProgress(lastProgressRef.current, '', currentWPM);
        }
      }
    }, 1000);

    // Init with first calculation
    const initialWPM = calculateWPM();
    setWpm(initialWPM);
    if (lastProgressRef.current !== null && onProgress) {
      onProgress(lastProgressRef.current, '', initialWPM);
    }

    return () => clearInterval(interval);
  }, [isStarted, isCompleted, startTime, onProgress]);
  
  /**
   * Calculate WPM based on typing progress
   * @param {number} completedWords - Number of completed words (can be fractional)
   * @param {number} totalChars - Total characters typed
   * @returns {number} - WPM value
   */
  const calculateWPM = (completedWords, totalChars) => {
    // If specific values aren't provided, use default calculation
    if (completedWords === undefined && totalChars === undefined) {
      return lastValidWpmRef.current;
    }
    
    const timeElapsed = (Date.now() - startTime) / 1000 / 60; // in minutes
    if (timeElapsed <= 0.01) return lastValidWpmRef.current; // Return last valid WPM if time is very small
    
    // Standard WPM calculation (5 characters = 1 word)
    const standardWordLength = 5;
    const standardWords = totalChars / standardWordLength;
    
    // Calculate WPM and ensure it's never negative
    const calculatedWpm = Math.max(0, Math.round(standardWords / timeElapsed));
    
    // Store this as the last valid WPM
    if (calculatedWpm > 0) {
      lastValidWpmRef.current = calculatedWpm;
    }
    
    // If the calculated WPM is 0 but we have a previous valid value, use that instead
    return calculatedWpm > 0 ? calculatedWpm : lastValidWpmRef.current;
  };
  
  /**
   * Calculate final WPM at race completion
   * @param {number} completedWords - Number of completed words
   * @param {number} totalChars - Total characters typed
   * @returns {number} - Final WPM value
   */
  const calculateFinalWPM = (completedWords, totalChars) => {
    const timeElapsed = (Date.now() - startTime) / 1000 / 60;
    if (timeElapsed <= 0) return lastValidWpmRef.current;
    
    // Use standard calculation based on characters
    const standardWordLength = 5;
    const standardWords = totalChars / standardWordLength;
    
    const finalWPM = Math.max(lastValidWpmRef.current, Math.round(standardWords / timeElapsed));
    setWpm(finalWPM);
    lastValidWpmRef.current = finalWPM;
    
    return finalWPM;
  };
  
  /**
   * Reset WPM calculation
   */
  const resetWpm = () => {
    setWpm(0);
    setStartTime(null);
    lastValidWpmRef.current = 0;
    lastWpmUpdateRef.current = null;
    lastUpdateTimeRef.current = null;
  };
  
  return {
    wpm,
    setWpm,
    startTime,
    setStartTime,
    calculateWPM,
    calculateFinalWPM,
    resetWpm,
    lastValidWpmRef,
    lastProgressRef
  };
};

export default useWpmCalculation; 