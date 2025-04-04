import React from 'react';
import './RaceTrack.css';
import CarIcon from './CarIcon';

function RaceTrack({ racers, onReady, isReady, countdown, raceState }) {
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
        {displayRacers.map((racer, index) => (
          <div key={racer.id} className="car-lane" data-testid="race-player-slot">
            <div className="lane-info">
              <span className="racer-name">{racer.name || `Player ${index + 1}`}</span>
              <span className="racer-stats">
                <span className="wpm-display">{racer.wpm || 0} WPM</span>
                <span className="progress-display">{Math.round(racer.progress || 0)}%</span>
                {racer.progress >= 100 && (
                  <span className="place-display">{getPlace(racer)}</span>
                )}
              </span>
            </div>
            <div className="lane-divider"></div>
            <div className="race-progress">
              <div
                className="car-container"
                style={{
                  left: `${racer.progress || 0}%`,
                  transition: 'left 0.2s ease-out'
                }}
              >
                <CarIcon color={getRacerColor(index)} />
              </div>
              <div className="finish-line"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RaceTrack; 