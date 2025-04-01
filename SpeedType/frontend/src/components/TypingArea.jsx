import React, { useState, useEffect, useRef } from 'react';
import './TypingArea.css';

// Receive typedText and setTypedText as props now
function TypingArea({ textToType, onProgress, typedText, setTypedText }) {
  // const [typedText, setTypedText] = useState(''); // Remove local state
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isCurrentWordIncorrect, setIsCurrentWordIncorrect] = useState(false);
  const [maxProgress, setMaxProgress] = useState(0); // Track maximum progress achieved
  const [startTime, setStartTime] = useState(null);
  const [wpm, setWpm] = useState(0);
  const inputRef = useRef(null);

  // Focus the input when the component mounts or when textToType changes
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
    setTypedText('');
    setIsCurrentWordIncorrect(false);
    setMaxProgress(0); // Reset max progress when text changes
    setStartTime(null);
    setWpm(0);
  }, [textToType, setTypedText]);

  // Calculate WPM
  useEffect(() => {
    if (!startTime || !typedText) {
      setWpm(0);
      return;
    }

    const timeElapsed = (Date.now() - startTime) / 1000 / 60; // Convert to minutes
    const wordsTyped = typedText.trim().split(/\s+/).length;
    const currentWpm = Math.round(wordsTyped / timeElapsed);
    setWpm(currentWpm);
  }, [typedText, startTime]);

  // Also focus when clicking anywhere in the typing area container
  const handleContainerClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const calculateProgress = (currentInput) => {
    // Count correctly typed characters
    let correctChars = 0;
    for (let i = 0; i < currentInput.length && i < textToType.length; i++) {
      if (currentInput[i] === textToType[i]) {
        correctChars++;
      }
    }
    
    // Calculate current progress based on correct characters
    const currentProgress = Math.min(100, (correctChars / textToType.length) * 100);
    
    // Only update if we've typed more correct characters than before
    if (currentProgress > maxProgress) {
      setMaxProgress(currentProgress);
      return currentProgress;
    }
    
    // Otherwise return the previous maximum progress
    return maxProgress;
  };

  const handleInputChange = (event) => {
    const currentInput = event.target.value;
    setTypedText(currentInput);

    // Set start time on first input if not set
    if (!startTime) {
      setStartTime(Date.now());
    }

    // Calculate and update progress
    const progress = calculateProgress(currentInput);
    onProgress(progress, currentInput, wpm); // Pass WPM to parent

    // Check if the current word being typed has errors
    const sourceWords = textToType.split(/(\s+)/);
    const typedWords = currentInput.split(/(\s+)/);
    const currentSourceWordIndex = typedWords.length - 1;
    const currentSourceWord = sourceWords[currentSourceWordIndex];
    const currentTypedWord = typedWords[currentSourceWordIndex];

    if (currentTypedWord && currentSourceWord) {
      const partOfSourceWord = currentSourceWord.substring(0, currentTypedWord.length);
      setIsCurrentWordIncorrect(currentTypedWord !== partOfSourceWord);
    } else {
      setIsCurrentWordIncorrect(false);
    }
  };

  // Placeholder text if none is provided yet
  const displayText = textToType || "Loading text...";

  // Split text into characters for highlighting later
  const textChars = displayText.split('');

  return (
    <div className="typing-area-container" onClick={handleContainerClick}>
      <h2>Type the text below:</h2>
      <div className="text-display">
        {/* Highlight logic will need typedText */}
        {textChars.map((char, index) => {
          let className = 'char-pending'; // Default class for untyped chars
          if (index < typedText.length) {
            if (char === typedText[index]) {
              className = 'char-typed char-correct';
            } else {
              className = 'char-typed char-incorrect';
            }
          }
          // Add class for cursor position (optional, simple version)
          // if (index === typedText.length) {
          //   className += ' char-current';
          // }

          // Handle spaces specifically if needed for styling
          if (char === ' ') {
              return <span key={index} className={`${className} char-space`}> </span>;
          }

          return (
            <span key={index} className={className}>
              {char}
            </span>
          );
        })}
      </div>
      <input
        ref={inputRef}
        type="text"
        value={typedText}
        onChange={handleInputChange}
        placeholder="Start typing here..."
        className={`typing-input ${isCurrentWordIncorrect ? 'input-error' : ''}`}
        disabled={!textToType} // Only disable if there's no text to type
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
      />
      {/* WPM and Accuracy display can go here */}
    </div>
  );
}

export default TypingArea; 