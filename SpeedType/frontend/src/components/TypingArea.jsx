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
    }
  }, [textToType]);

  // Set start time when race starts
  useEffect(() => {
    console.log('Race started:', isStarted);
    if (isStarted && !startTime) {
      setStartTime(Date.now());
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
      if (timeElapsed === 0) return 0;
      
      // Count completed words including the current word if it's complete
      let completedWords = currentWordIndex;
      if (input === currentWord) {
        completedWords++;
      }
      
      return Math.round(completedWords / timeElapsed);
    };

    const interval = setInterval(() => {
      if (isCompleted) {
        // Clear interval if race becomes completed
        clearInterval(interval);
        return;
      }
      const currentWPM = calculateWPM();
      setWpm(currentWPM);
      onProgress(lastProgressRef.current, input, currentWPM);
    }, 1000); // Update every second

    // Calculate initial WPM
    const initialWPM = calculateWPM();
    setWpm(initialWPM);
    onProgress(lastProgressRef.current, input, initialWPM);

    return () => clearInterval(interval);
  }, [isStarted, isCompleted, startTime, currentWordIndex, input, currentWord]);

  const calculateProgress = (newInput) => {
    if (!textToType) return 0;
    if (isCompleted) return 100;

    // Calculate total characters in completed words
    const completedWords = words.slice(0, currentWordIndex);
    let totalCorrectChars = completedWords.join(' ').length;
    
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

    // Calculate progress percentage
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
      lastProgressRef.current = newProgress;
      // Only emit progress update on actual progress change
      if (newProgress !== progress) {
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
        const finalWPM = Math.round((currentWordIndex + 1) / timeElapsed);
        setWpm(finalWPM);
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
        const finalWPM = Math.round((currentWordIndex + 1) / timeElapsed);
        setWpm(finalWPM);
        onProgress(finalProgress, newInput, finalWPM);
      } else {
        // Move to next word
        setCurrentWordIndex(prev => prev + 1);
        setInput('');
        setIsError(false);
        
        // Calculate progress for the completed word including its space
        const completedText = words.slice(0, currentWordIndex + 1).join(' ');
        const newProgress = calculateProgress(completedText);
        
        // Ensure progress never decreases
        if (newProgress > lastProgressRef.current) {
          setProgress(newProgress);
          lastProgressRef.current = newProgress;
          onProgress(newProgress, '', wpm);
        } else {
          // If progress would decrease, keep the previous progress
          onProgress(lastProgressRef.current, '', wpm);
        }
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
          <div className="wpm-display">{wpm} WPM</div>
        </div>
      )}
    </div>
  );
};

export default TypingArea; 