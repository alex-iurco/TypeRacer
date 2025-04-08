import React from 'react';
import PropTypes from 'prop-types';

/**
 * Component to display text with highlighting for typed characters
 */
const TextDisplay = ({ words, currentWordIndex, currentInput }) => {
  if (!words || words.length === 0) {
    console.log('No text to render');
    return null;
  }
  
  console.log('Rendering text:', words.join(' '));
  
  return (
    <div className="text-display">
      {words.map((word, wordIndex) => {
        const isCurrentWord = wordIndex === currentWordIndex;
        const isPastWord = wordIndex < currentWordIndex;
        
        return (
          <React.Fragment key={wordIndex}>
            {wordIndex > 0 && ' '}
            {word.split('').map((char, charIndex) => {
              const isTyped = isPastWord || (isCurrentWord && charIndex < currentInput.length);
              const isCorrect = isPastWord || (isCurrentWord && currentInput[charIndex] === char);
              
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

TextDisplay.propTypes = {
  words: PropTypes.arrayOf(PropTypes.string).isRequired,
  currentWordIndex: PropTypes.number.isRequired,
  currentInput: PropTypes.string.isRequired
};

export default TextDisplay; 