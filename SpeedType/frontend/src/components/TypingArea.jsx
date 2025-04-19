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
    calculateWPM,
    calculateFinalWPM,
    resetWpm,
    lastValidWpmRef,
    lastProgressRef: wpmProgressRef
  } = useWpmCalculation(onProgress, isStarted, isCompleted);

  // Track if we already shared the refs to avoid infinite loops
  const refsSharedRef = useRef(false);

  // Share progress ref between hooks
  useEffect(() => {
    if (wpmProgressRef && lastProgressRef && !refsSharedRef.current) {
      wpmProgressRef.current = lastProgressRef.current;
      refsSharedRef.current = true;
    }
  }, [wpmProgressRef, lastProgressRef]);

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

    // Check if input matches current word
    if (checkInputMatch(newInput)) {
      setIsError(false);
      
      // Calculate and update progress
      const newProgress = calculateProgress(words, currentWordIndex, currentWord, newInput, isCompleted);
      updateProgress(newProgress, newInput, wpm);

      // Check if current word is complete
      if (currentWordIndex === words.length - 1 && newInput === currentWord) {
        // Trigger completion state update via the hook FIRST
        completeWord();

        // Calculate final metrics
        const totalChars = getTypedChars();
        const finalWPM = calculateFinalWPM(words.length, totalChars);
        
        // Complete progress SECOND (notify parent)
        completeProgress(newInput, finalWPM);
      }
    } else {
      setIsError(true);
    }

    // If space is pressed and input matches current word
    if (e.nativeEvent.data === ' ' && newInput.trim() === currentWord) {
      const raceCompletedByHook = completeWord();
      
      if (raceCompletedByHook) {
        // Race is complete - final word with space
        // Calculate final WPM
        const totalChars = getTypedChars();
        const finalWPM = calculateFinalWPM(words.length, totalChars);
        
        // Complete progress
        completeProgress(newInput, finalWPM);
      } else {
        // Just move to next word
        setInput('');
        
        // Calculate progress for the completed word
        const newProgress = calculateProgress(words, currentWordIndex + 1, '', '', false);
        
        // Update progress
        updateProgress(newProgress, '', wpm);
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
  isRaceComplete: false
};

export default TypingArea; 