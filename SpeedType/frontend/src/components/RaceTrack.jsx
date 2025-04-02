import React from 'react';
import './RaceTrack.css';
import CarIcon from './CarIcon';

function RaceTrack({ racers }) {
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

  return (
    <div className="race-track-container">
      <div className="race-track">
        {racers && racers.length > 0 ? (
          racers.map((racer, index) => (
            <div key={racer.id} className="car-lane">
              <div className="lane-divider"></div>
              <div
                className="car-container"
                style={{
                  left: `${Math.min(85, racer.progress)}%`,
                  transition: 'left 0.2s ease-out'
                }}
              >
                <CarIcon color={getRacerColor(index)} />
                <span className="racer-name">{racer.name}</span>
              </div>
              <div className="finish-line-stats">
                <span className="wpm-display">{racer.wpm || 0} wpm</span>
                {racer.progress >= 100 && (
                  <span className="place-display">{getPlace(racer)}</span>
                )}
              </div>
            </div>
          ))
        ) : (
          <p>Waiting for racers...</p>
        )}
      </div>
    </div>
  );
}

export default RaceTrack; 