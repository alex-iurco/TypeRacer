import React from 'react';
import PropTypes from 'prop-types';

/**
 * Component to display race completion results
 */
const CompletionResults = ({ wpm, lastValidWpm }) => {
  return (
    <div className="race-complete">
      <h3>Race Complete!</h3>
      <div className="wpm-display">{wpm > 0 ? wpm : lastValidWpm} WPM</div>
    </div>
  );
};

CompletionResults.propTypes = {
  wpm: PropTypes.number.isRequired,
  lastValidWpm: PropTypes.number
};

CompletionResults.defaultProps = {
  lastValidWpm: 0
};

export default CompletionResults; 