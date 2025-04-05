import React, { useState, useEffect, useRef } from 'react';
import './TypingArea.css';

const TypingArea = ({ textToType = '', onProgress, isMultiplayer, isStarted, onStart, isRaceComplete }) => {
  const [input, setInput] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isError, setIsError] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [wpm, setWpm] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef(null);
  const lastProgressRef = useRef(0);
  const textRef = useRef(textToType);
  const lastWpmUpdateRef = useRef(null);
  const lastUpdateTimeRef = useRef(null);
  const lastValidWpmRef = useRef(0);

  // Split text into words
  const words = textToType.split(' ');
  const currentWord = words[currentWordIndex] || '';

  // Update text ref when text changes
  useEffect(() => {
    console.log('Text changed:', textToType);
    textRef.current = textToType;
  }, [textToType]);

  // Reset state when race starts or text changes
  useEffect(() => {
    console.log('Text or race state changed:', { textToType, isStarted, isRaceComplete });
    if (textToType) {
      setInput('');
      setCurrentWordIndex(0);
      setIsError(false);
      setProgress(0);
      lastProgressRef.current = 0;
      setIsCompleted(false);
      setStartTime(null);
      setWpm(0);
      lastValidWpmRef.current = 0;
    }
  }, [textToType]);

  // Set start time when race starts
  useEffect(() => {
    console.log('Race started:', isStarted);
    if (isStarted && !startTime) {
      setStartTime(Date.now());
      lastUpdateTimeRef.current = Date.now();
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [isStarted]);

  // Only update WPM periodically
  useEffect(() => {
    if (!startTime) return;
    if (!isStarted && !isCompleted) return;
    if (isCompleted) {
      // Don't start interval if race is completed
      return;
    }

    const calculateWPM = () => {
      const timeElapsed = (Date.now() - startTime) / 1000 / 60; // in minutes
      if (timeElapsed <= 0.01) return lastValidWpmRef.current; // Return last valid WPM if time is very small
      
      // Count completed words including the current word if it's complete
      let completedWords = currentWordIndex;
      
      // Add partial progress on current word
      if (input.length > 0) {
        let correctChars = 0;
        for (let i = 0; i < input.length && i < currentWord.length; i++) {
          if (input[i] === currentWord[i]) {
            correctChars++;
          } else {
            break;
          }
        }
        const wordProgress = correctChars / currentWord.length;
        completedWords += wordProgress;
      }
      
      // Standard WPM calculation (5 characters = 1 word)
      const standardWordLength = 5;
      const totalChars = words.slice(0, currentWordIndex).join('').length + 
                        (input.length > 0 ? input.length : 0);
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

    const interval = setInterval(() => {
      if (isCompleted) {
        clearInterval(interval);
        return;
      }
      const currentWPM = calculateWPM();
      setWpm(currentWPM);
      
      // Only send periodic updates if there's a significant change or every 2 seconds
      if (!lastWpmUpdateRef.current || 
          Math.abs(currentWPM - lastWpmUpdateRef.current) > 5 || 
          Date.now() - lastUpdateTimeRef.current > 2000) {
        lastWpmUpdateRef.current = currentWPM;
        lastUpdateTimeRef.current = Date.now();
        onProgress(lastProgressRef.current, input, currentWPM);
      }
    }, 1000); // Update every second instead of half-second

    // Calculate initial WPM
    const initialWPM = calculateWPM();
    setWpm(initialWPM);
    onProgress(lastProgressRef.current, input, initialWPM);

    return () => clearInterval(interval);
  }, [isStarted, isCompleted, startTime, currentWordIndex, input, currentWord]);

  const calculateProgress = (newInput) => {
    if (!textToType) return 0;
    if (isCompleted) return 100;

    // Calculate total characters in completed words including spaces
    const completedWords = words.slice(0, currentWordIndex);
    let totalCorrectChars = completedWords.join(' ').length;
    if (currentWordIndex > 0) {
      // Add space for each completed word except the last one
      totalCorrectChars += 1;
    }
    
    // Add correct characters from current word
    if (newInput) {
      for (let i = 0; i < newInput.length && i < currentWord.length; i++) {
        if (newInput[i] === currentWord[i]) {
          totalCorrectChars++;
        } else {
          break;
        }
      }
    }

    // Calculate progress percentage based on total characters including spaces
    const totalChars = textToType.length;
    const progress = Math.min(100, Math.round((totalCorrectChars / totalChars) * 100));
    return progress;
  };

  const handleInputChange = (e) => {
    if (!isStarted || isCompleted || !textToType) return;
    
    const newInput = e.target.value;
    setInput(newInput);

    // Check if the current input matches the current word
    if (currentWord.startsWith(newInput)) {
      setIsError(false);
      const newProgress = calculateProgress(newInput);
      setProgress(newProgress);
      
      // Only emit progress update on significant progress change (at least 1%)
      if (Math.abs(newProgress - lastProgressRef.current) >= 1) {
        lastProgressRef.current = newProgress;
        onProgress(newProgress, newInput, wpm);
      }

      // Check if we've completed the last word
      if (currentWordIndex === words.length - 1 && newInput === currentWord) {
        setIsCompleted(true);
        const finalProgress = 100;
        setProgress(finalProgress);
        lastProgressRef.current = finalProgress;
        // Calculate final WPM
        const timeElapsed = (Date.now() - startTime) / 1000 / 60;
        const finalWPM = Math.max(lastValidWpmRef.current, Math.round((currentWordIndex + 1) / timeElapsed));
        setWpm(finalWPM);
        // Store the final WPM to prevent it being reset
        lastValidWpmRef.current = finalWPM;
        onProgress(finalProgress, newInput, finalWPM);
      }
    } else {
      setIsError(true);
    }

    // If space is pressed and input matches current word
    if (e.nativeEvent.data === ' ' && newInput.trim() === currentWord) {
      if (currentWordIndex === words.length - 1) {
        // Race completed
        setIsCompleted(true);
        const finalProgress = 100;
        setProgress(finalProgress);
        lastProgressRef.current = finalProgress;
        // Calculate final WPM
        const timeElapsed = (Date.now() - startTime) / 1000 / 60;
        const finalWPM = Math.max(lastValidWpmRef.current, Math.round((currentWordIndex + 1) / timeElapsed));
        setWpm(finalWPM);
        // Store the final WPM to prevent it being reset
        lastValidWpmRef.current = finalWPM;
        onProgress(finalProgress, newInput, finalWPM);
      } else {
        // Move to next word
        setCurrentWordIndex(prev => prev + 1);
        setInput('');
        setIsError(false);
        
        // Calculate progress for the completed word including its space
        const completedText = words.slice(0, currentWordIndex + 1).join(' ');
        const newProgress = calculateProgress(completedText);
        
        // Always update progress on word completion
        setProgress(newProgress);
        lastProgressRef.current = newProgress;
        onProgress(newProgress, '', wpm);
      }
    }
  };

  const renderText = () => {
    if (!textToType) {
      console.log('No text to render');
      return null;
    }
    
    console.log('Rendering text:', textToType);
    let typedCharCount = 0;
    const typedWords = words.slice(0, currentWordIndex).join(' ');
    typedCharCount = typedWords.length + (currentWordIndex > 0 ? 1 : 0); // Add space if not first word

    return (
      <div className="text-display">
        {words.map((word, wordIndex) => {
          const isCurrentWord = wordIndex === currentWordIndex;
          const isPastWord = wordIndex < currentWordIndex;
          
          return (
            <React.Fragment key={wordIndex}>
              {wordIndex > 0 && ' '}
              {word.split('').map((char, charIndex) => {
                const isTyped = isPastWord || (isCurrentWord && charIndex < input.length);
                const isCorrect = isPastWord || (isCurrentWord && input[charIndex] === char);
                
                return (
                  <span
                    key={charIndex}
                    className={`
                      ${isTyped ? 'char-typed' : 'char-pending'}
                      ${isTyped ? (isCorrect ? 'char-correct' : 'char-incorrect') : ''}
                      ${char === ' ' ? 'char-space' : ''}
                    `}
                  >
                    {char}
                  </span>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
    );
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
          {renderText()}
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
        <div className="input-container">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            className={`typing-input ${isError ? 'input-error' : ''}`}
            placeholder="Type here..."
            disabled={!isStarted || isCompleted}
            autoFocus
          />
          {isError && <div className="error-indicator" />}
        </div>
      )}
      
      {/* Show completion message */}
      {isCompleted && (
        <div className="race-complete">
          <h3>Race Complete!</h3>
          <div className="wpm-display">{wpm > 0 ? wpm : lastValidWpmRef.current} WPM</div>
        </div>
      )}
    </div>
  );
};

export default TypingArea; 