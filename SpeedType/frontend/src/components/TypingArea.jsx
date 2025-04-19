import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import './TypingArea.css';

// Import custom hooks
import useTypingState from '../hooks/useTypingState';
import useProgressCalculation from '../hooks/useProgressCalculation';
import useWpmCalculation from '../hooks/useWpmCalculation';

// Import components
import TextDisplay from './TextDisplay';
import TypingInput from './TypingInput';
import CompletionResults from './CompletionResults';

const TypingArea = ({ 
  textToType = '', 
  onProgress, 
  onWpmUpdate,
  isMultiplayer, 
  isStarted, 
  onStart, 
  isRaceComplete 
}) => {
  // Initialize typing state
  const {
    input,
    setInput,
    currentWordIndex,
    isError,
    setIsError,
    isCompleted,
    words,
    currentWord,
    checkInputMatch,
    completeWord,
    resetTypingState
  } = useTypingState(textToType);

  // Initialize progress tracking
  const {
    progress,
    calculateProgress,
    updateProgress,
    completeProgress,
    resetProgress,
    lastProgressRef
  } = useProgressCalculation(onProgress);

  // Initialize WPM calculation
  const {
    wpm,
    startTime,
    updateMetrics,
    calculateWPM,
    calculateFinalWPM,
    resetWpm,
    lastValidWpmRef
  } = useWpmCalculation(isStarted, isCompleted);

  // Effect to report WPM updates upward
  useEffect(() => {
    if (onWpmUpdate && wpm !== undefined) {
      onWpmUpdate(wpm);
    }
  }, [wpm, onWpmUpdate]);

  // Handle input change
  const handleInputChange = (e) => {
    if (!isStarted || isCompleted || !textToType) return;
    
    const newInput = e.target.value;
    setInput(newInput);

    // Calculate total typed characters for WPM
    const getTypedChars = () => {
      // Count completed words
      const completedWordChars = words.slice(0, currentWordIndex).join('').length;
      // Add spaces between words
      const spacesCount = Math.max(0, currentWordIndex);
      // Add current input length
      return completedWordChars + spacesCount + newInput.length;
    };
    const currentTotalChars = getTypedChars();

    // Check if input matches current word
    if (checkInputMatch(newInput)) {
      setIsError(false);
      
      // Update WPM hook with the latest char count FIRST
      updateMetrics(currentTotalChars);
      
      // Calculate and update progress
      const newProgress = calculateProgress(words, currentWordIndex, currentWord, newInput, isCompleted);
      updateProgress(newProgress, newInput);

      // Check if current word is complete
      if (currentWordIndex === words.length - 1 && newInput === currentWord) {
        // Trigger completion state update via the hook FIRST
        const raceCompletedByHook = completeWord();
        
        if (raceCompletedByHook) {
          // Calculate final metrics
          const finalTotalChars = getTypedChars();
          const finalWPM = calculateFinalWPM(words.length, finalTotalChars);
          
          // Complete progress SECOND (notify parent)
          completeProgress(newInput);
        }
      }
    } else {
      setIsError(true);
      // Still update metrics even on error so WPM calculation can continue
      updateMetrics(currentTotalChars);
      // Update progress (potentially with stale WPM, but needed for progress bar)
      const newProgress = calculateProgress(words, currentWordIndex, currentWord, newInput, isCompleted);
      updateProgress(newProgress, newInput);
    }

    // If space is pressed and input matches current word
    if (e.nativeEvent.data === ' ' && newInput.trim() === currentWord) {
      // Get char count *before* completing word/clearing input
      const charsIncludingCompletedWord = getTypedChars();
      
      const raceCompletedByHook = completeWord();
      
      if (raceCompletedByHook) {
        // Race is complete - final word with space
        const finalWPM = calculateFinalWPM(words.length, charsIncludingCompletedWord);
        
        // Complete progress
        completeProgress(newInput);
      } else {
        // Just move to next word
        setInput('');
        
        // Update WPM hook metrics *after* completing the word
        updateMetrics(charsIncludingCompletedWord);
        
        // Calculate progress for the completed word (using nextWordIndex)
        const nextWordIndex = currentWordIndex + 1;
        const newProgress = calculateProgress(words, nextWordIndex, '', '', false);
        
        // Update progress (pass current wpm state from hook)
        updateProgress(newProgress, '');
      }
    }
  };

  return (
    <div className="typing-area-container">
      {/* Debug info */}
      <div style={{ display: 'none' }}>
        <p>Text: {textToType}</p>
        <p>Started: {isStarted ? 'yes' : 'no'}</p>
        <p>Complete: {isRaceComplete ? 'yes' : 'no'}</p>
      </div>

      {/* Always show text if available */}
      {textToType && (
        <div className="text-container" style={{ opacity: isStarted ? 1 : 0.7 }}>
          <TextDisplay
            words={words}
            currentWordIndex={currentWordIndex}
            currentInput={input}
          />
        </div>
      )}
      
      {/* Show start button only in appropriate state */}
      {!isStarted && !isMultiplayer && !isRaceComplete && (
        <button className="start-button" onClick={onStart}>
          Start Race
        </button>
      )}
      
      {/* Show input field when race is active */}
      {isStarted && !isCompleted && textToType && (
        <TypingInput
          input={input}
          onChange={handleInputChange}
          isError={isError}
          isStarted={isStarted}
          isCompleted={isCompleted}
        />
      )}
      
      {/* Show completion message */}
      {isCompleted && (
        <CompletionResults
          wpm={wpm}
          lastValidWpm={lastValidWpmRef.current}
        />
      )}
    </div>
  );
};

TypingArea.propTypes = {
  textToType: PropTypes.string,
  onProgress: PropTypes.func.isRequired,
  onWpmUpdate: PropTypes.func.isRequired,
  isMultiplayer: PropTypes.bool,
  isStarted: PropTypes.bool,
  onStart: PropTypes.func,
  isRaceComplete: PropTypes.bool
};

TypingArea.defaultProps = {
  textToType: '',
  isMultiplayer: false,
  isStarted: false,
  onStart: () => {},
  onWpmUpdate: () => {},
  isRaceComplete: false
};

export default TypingArea; 