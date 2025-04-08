import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Component for handling typing input from the user
 */
const TypingInput = ({ 
  input, 
  onChange, 
  isError, 
  isStarted, 
  isCompleted, 
  autoFocus 
}) => {
  const inputRef = useRef(null);
  
  // Auto-focus when started
  useEffect(() => {
    if (isStarted && !isCompleted && inputRef.current && autoFocus) {
      inputRef.current.focus();
    }
  }, [isStarted, isCompleted, autoFocus]);
  
  return (
    <div className="input-container">
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={onChange}
        className={`typing-input ${isError ? 'input-error' : ''}`}
        placeholder="Type here..."
        disabled={!isStarted || isCompleted}
        autoFocus={autoFocus}
      />
      {isError && <div className="error-indicator" />}
    </div>
  );
};

TypingInput.propTypes = {
  input: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  isError: PropTypes.bool.isRequired,
  isStarted: PropTypes.bool.isRequired,
  isCompleted: PropTypes.bool.isRequired,
  autoFocus: PropTypes.bool
};

TypingInput.defaultProps = {
  autoFocus: true
};

export default TypingInput; 