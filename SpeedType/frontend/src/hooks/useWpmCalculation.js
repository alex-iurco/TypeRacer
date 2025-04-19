import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Custom hook to calculate and manage WPM
 * @param {boolean} isStarted - Whether the race has started
 * @param {boolean} isCompleted - Whether the race is completed
 * @returns {Object} - WPM state and related functions
 */
const useWpmCalculation = (isStarted, isCompleted) => {
  const [wpm, setWpm] = useState(0);
  const [startTime, setStartTime] = useState(null);
  
  const lastWpmUpdateRef = useRef(null);
  const lastUpdateTimeRef = useRef(null);
  const lastValidWpmRef = useRef(0);
  const currentCharCountRef = useRef(0);
  
  // Reference to last progress value - needed? progress is related to wpm
  const lastProgressRef = useRef(0);
  
  // Set start time when race starts
  useEffect(() => {
    console.log('WPM Hook - Race started prop:', isStarted);
    if (isStarted && !startTime) {
      console.log('WPM Hook - Setting Start Time');
      setStartTime(Date.now());
      lastUpdateTimeRef.current = Date.now();
      currentCharCountRef.current = 0;
    }
  }, [isStarted, startTime]);

  // Callback for TypingArea to update the character count
  const updateMetrics = useCallback((charCount) => {
    currentCharCountRef.current = charCount;
  }, []);
  
  /**
   * Calculate WPM based on typing progress
   * @param {number} completedWords - Number of completed words (can be fractional) - Not used currently
   * @param {number} totalChars - Total characters typed
   * @returns {number} - WPM value
   */
  const calculateWPM = useCallback((completedWords, totalChars) => {
    if (!startTime || totalChars === undefined || totalChars <= 0) {
      // Return 0 if race hasn't started or no chars typed, keep lastValidWpmRef at 0 until first calc > 0
      // console.log(`calculateWPM: Returning 0 (startTime=${startTime}, totalChars=${totalChars})`);
      return 0; 
    }
    
    const timeElapsed = (Date.now() - startTime) / 1000 / 60; // in minutes
    // Avoid division by zero or near-zero time causing huge WPM
    if (timeElapsed < 0.001) {
      // console.log(`calculateWPM: Returning 0 (timeElapsed too small: ${timeElapsed})`);
      return 0; 
    }
    
    // Standard WPM calculation (5 characters = 1 word)
    const standardWordLength = 5;
    const standardWords = totalChars / standardWordLength;
    
    // Calculate WPM and ensure it's never negative
    const calculatedWpm = Math.max(0, Math.round(standardWords / timeElapsed));
    // console.log(`calculateWPM: totalChars=${totalChars}, timeElapsed=${timeElapsed.toFixed(4)}m, standardWords=${standardWords.toFixed(2)}, calculatedWpm=${calculatedWpm}`);
    
    // Store this as the last valid WPM if it's greater than 0
    if (calculatedWpm > 0) {
      // console.log(`calculateWPM: Updating lastValidWpmRef from ${lastValidWpmRef.current} to ${calculatedWpm}`);
      lastValidWpmRef.current = calculatedWpm;
      return calculatedWpm; // Return the newly calculated positive WPM
    }
    
    // If calculatedWpm is 0, return the last valid one we stored (or 0 if none stored yet)
    // console.log(`calculateWPM: Calculation is 0, returning lastValidWpmRef: ${lastValidWpmRef.current}`);
    return lastValidWpmRef.current;
  }, [startTime]);

  /**
   * Calculate final WPM at race completion
   * @param {number} completedWords - Number of completed words - Not used currently
   * @param {number} totalChars - Total characters typed
   * @returns {number} - Final WPM value
   */
  const calculateFinalWPM = useCallback((completedWords, totalChars) => {
    if (!startTime) {
      // console.log('calculateFinalWPM: No start time, returning last valid:', lastValidWpmRef.current);
      return lastValidWpmRef.current;
    }
    const timeElapsed = (Date.now() - startTime) / 1000 / 60;
    if (timeElapsed <= 0) {
      // console.log('calculateFinalWPM: Zero/negative time, returning last valid:', lastValidWpmRef.current);
      return lastValidWpmRef.current;
    }
    
    // Use standard calculation based on characters
    const standardWordLength = 5;
    const standardWords = totalChars / standardWordLength;
    
    // Ensure final WPM is at least the last recorded valid WPM
    const finalWPM = Math.max(lastValidWpmRef.current, Math.round(standardWords / timeElapsed));
    // console.log(`calculateFinalWPM: totalChars=${totalChars}, timeElapsed=${timeElapsed.toFixed(4)}m, standardWords=${standardWords.toFixed(2)}, finalWPM=${finalWPM}`);
    
    setWpm(finalWPM); // Update state
    lastValidWpmRef.current = finalWPM; // Update ref
    
    return finalWPM;
  }, [startTime]); // Removed setWpm dependency

  /**
   * Reset WPM calculation
   */
  const resetWpm = useCallback(() => {
    // console.log('WPM Hook - Resetting WPM state');
    setWpm(0);
    setStartTime(null);
    lastValidWpmRef.current = 0;
    lastWpmUpdateRef.current = null;
    lastUpdateTimeRef.current = null;
    currentCharCountRef.current = 0;
    lastProgressRef.current = 0;
  }, []);

  // WPM calculation interval
  useEffect(() => {
    // console.log(`WPM Interval Effect: startTime=${startTime}, isStarted=${isStarted}, isCompleted=${isCompleted}`);
    if (!startTime || !isStarted || isCompleted) {
        // Clear interval if conditions aren't met or race is over
        // console.log('WPM Interval Effect: Clearing interval or not starting.');
        return () => {}; 
    }

    // console.log('WPM Interval Effect: Setting up interval.');
    const interval = setInterval(() => {
      // Use the stored character count
      const currentWPM = calculateWPM(undefined, currentCharCountRef.current);
      // --- DEBUG LOGGING ---
      // console.log(
      //   `WPM Interval Tick: StartTime=${startTime ? 'Set' : 'null'}, ` +
      //   `CharCount=${currentCharCountRef.current}, ` +
      //   `CalculatedWPM=${currentWPM}, ` +
      //   `CurrentStateWPM=${wpm}` // Log current state WPM for comparison
      // );
      // --- END DEBUG LOGGING ---
      
      // Only update if WPM actually changed to avoid unnecessary re-renders
      if (currentWPM !== wpm) { 
        // --- DEBUG LOGGING ---
        // console.log(`WPM Interval Tick: Attempting to update WPM state from ${wpm} to ${currentWPM}`);
        // --- END DEBUG LOGGING ---
        setWpm(currentWPM);
      }
      
    }, 1000); // Calculate every second

    return () => {
      // console.log('WPM Interval Effect: Cleaning up interval.');
      clearInterval(interval);
    };
    // Add wpm to dependencies to restart interval if manual setWpm occurs (unlikely here)
  }, [isStarted, isCompleted, startTime, wpm, calculateWPM]); 
  
  return {
    wpm,
    startTime,
    updateMetrics,
    calculateWPM,
    calculateFinalWPM,
    resetWpm,
    lastValidWpmRef
  };
};

export default useWpmCalculation; 