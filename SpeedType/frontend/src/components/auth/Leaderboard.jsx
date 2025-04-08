import { useState, useEffect } from 'react';
import { config } from '../../config/env';
import './Leaderboard.css';

const Leaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${config.BACKEND_URL}/api/users/leaderboard`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard data');
        }
        
        const data = await response.json();
        setLeaderboardData(data.leaderboard || []);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError('Unable to load leaderboard. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, []);

  // Generate medal emoji based on position
  const getMedal = (position) => {
    switch (position) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return '';
    }
  };

  return (
    <div className="leaderboard-container">
      <h2 className="leaderboard-title">Top Typists</h2>
      
      {loading ? (
        <div className="leaderboard-loading">Loading leaderboard...</div>
      ) : error ? (
        <div className="leaderboard-error">{error}</div>
      ) : leaderboardData.length === 0 ? (
        <div className="leaderboard-empty">No leaderboard data available yet.</div>
      ) : (
        <div className="leaderboard-table">
          <div className="leaderboard-header">
            <div className="leaderboard-rank">Rank</div>
            <div className="leaderboard-user">User</div>
            <div className="leaderboard-wpm">Best WPM</div>
            <div className="leaderboard-avg">Avg WPM</div>
            <div className="leaderboard-races">Races</div>
          </div>
          
          {leaderboardData.map((user, index) => (
            <div key={user._id || index} className="leaderboard-row">
              <div className="leaderboard-rank">
                {index + 1} {getMedal(index)}
              </div>
              <div className="leaderboard-user">
                <div 
                  className="leaderboard-avatar" 
                  style={{ backgroundColor: user.avatarColor || '#4169e1' }}
                >
                  {(user.displayName || user.username || '').charAt(0).toUpperCase()}
                </div>
                <span className="leaderboard-username">
                  {user.displayName || user.username}
                </span>
              </div>
              <div className="leaderboard-wpm">{user.typingStats?.bestWpm || 0}</div>
              <div className="leaderboard-avg">{user.typingStats?.averageWpm?.toFixed(1) || 0}</div>
              <div className="leaderboard-races">{user.typingStats?.totalRaces || 0}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Leaderboard; 