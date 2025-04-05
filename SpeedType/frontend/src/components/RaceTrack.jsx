import React, { useRef, useEffect } from 'react';
import './RaceTrack.css';
import CarIcon from './CarIcon';

function RaceTrack({ racers, onReady, isReady, countdown, raceState }) {
  // Create refs to store the maximum progress value for each racer
  const maxProgressRefs = useRef({});
  // Create refs to store the maximum WPM values for each racer
  const maxWpmRefs = useRef({});
  
  // Assign distinct colors to racers (simple approach)
  const colors = ['#4169e1', '#dc143c', '#8b0000', '#4682b4', '#32cd32', '#ffd700'];
  const getRacerColor = (index) => colors[index % colors.length];

  // Sort racers by progress to determine places
  const sortedRacers = [...racers].sort((a, b) => b.progress - a.progress);
  const getPlace = (racer) => {
    const place = sortedRacers.findIndex(r => r.id === racer.id) + 1;
    if (place === 1) return '1st Place!';
    if (place === 2) return '2nd Place.';
    if (place === 3) return '3rd Place.';
    return `${place}th Place.`;
  };

  // Ensure we always have at least one racer (the player) in single-player mode
  const displayRacers = racers.length > 0 ? racers : [{ id: 'player', name: 'You', progress: 0, wpm: 0 }];
  
  // Update maxProgress and maxWPM values for each racer
  useEffect(() => {
    displayRacers.forEach(racer => {
      // Initialize if not exists
      if (!maxProgressRefs.current[racer.id]) {
        maxProgressRefs.current[racer.id] = 0;
      }
      
      // Initialize max WPM if not exists
      if (!maxWpmRefs.current[racer.id]) {
        maxWpmRefs.current[racer.id] = 0;
      }
      
      // Update only if new progress is greater than current max
      if (racer.progress > maxProgressRefs.current[racer.id]) {
        maxProgressRefs.current[racer.id] = racer.progress;
      }
      
      // Update max WPM if new value is greater than zero and greater than current max
      if (racer.wpm > 0 && racer.wpm > maxWpmRefs.current[racer.id]) {
        maxWpmRefs.current[racer.id] = racer.wpm;
      }
    });
  }, [displayRacers]);

  // Get the safe progress value that never goes backward
  const getSafeProgress = (racer) => {
    const maxProgress = maxProgressRefs.current[racer.id] || 0;
    return Math.max(racer.progress || 0, maxProgress);
  };

  // Get the safe WPM value that is never 0 after we've started typing
  const getSafeWpm = (racer) => {
    // If current WPM is greater than 0, use it
    if (racer.wpm > 0) {
      return racer.wpm;
    }
    
    // Otherwise use the max WPM we've seen for this racer
    return maxWpmRefs.current[racer.id] || 0;
  };

  return (
    <div className="race-track-container">
      <div className="race-status">
        {countdown > 0 && (
          <div className="countdown" data-testid="race-countdown">
            Race starts in: {countdown}
          </div>
        )}
        {!isReady && onReady && (
          <button 
            onClick={onReady} 
            className="ready-button"
            data-testid="race-ready-button"
          >
            Ready
          </button>
        )}
      </div>
      <div className="race-track" data-testid="race-player-list" data-race-state={raceState}>
        {displayRacers.map((racer, index) => {
          // Use the safe progress that never decreases
          const safeProgress = getSafeProgress(racer);
          
          return (
            <div key={racer.id} className="car-lane" data-testid="race-player-slot">
              <div className="lane-info">
                <div className="racer-info">
                  <span className="racer-name">{racer.name || `Player ${index + 1}`}</span>
                  <span className="racer-stats">
                    <span className="wpm-display">{getSafeWpm(racer)} WPM</span>
                    <span className="progress-display">{Math.round(racer.progress || 0)}%</span>
                    {racer.progress >= 100 && (
                      <span className="place-display">{getPlace(racer)}</span>
                    )}
                  </span>
                </div>
              </div>
              <div className="race-progress">
                <div
                  className="progress-bar"
                  style={{
                    width: `${safeProgress}%`,
                    backgroundColor: getRacerColor(index),
                    transition: 'width 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)'
                  }}
                />
                <div
                  className="car-container"
                  style={{
                    position: 'absolute',
                    left: `${safeProgress}%`,
                    top: '-20px',
                    transform: 'translateX(-50%)',
                    transition: 'left 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)'
                  }}
                >
                  <CarIcon color={getRacerColor(index)} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RaceTrack; 