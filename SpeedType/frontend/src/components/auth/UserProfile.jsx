import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './UserProfile.css';

const UserProfile = () => {
  const { currentUser, logout, updateProfile, getUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileData, setProfileData] = useState({
    displayName: '',
    avatarColor: '#4169e1'
  });
  
  // Load user data when component mounts
  useEffect(() => {
    if (currentUser) {
      setProfileData({
        displayName: currentUser.displayName || currentUser.username,
        avatarColor: currentUser.avatarColor || '#4169e1'
      });
    }
  }, [currentUser]);
  
  // Refresh user profile data
  const handleRefreshProfile = async () => {
    setLoading(true);
    setError('');
    try {
      await getUserProfile();
      setSuccess('Profile refreshed successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Error refreshing profile');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submission to update profile
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await updateProfile(profileData);
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };
  
  // Format date to a readable string
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  if (!currentUser) {
    return (
      <div className="profile-container">
        <p className="profile-message">Please login to view your profile</p>
      </div>
    );
  }
  
  const avatarStyle = {
    backgroundColor: profileData.avatarColor || currentUser.avatarColor || '#4169e1'
  };
  
  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="avatar" style={avatarStyle}>
          {(profileData.displayName || currentUser.displayName || currentUser.username || '').charAt(0).toUpperCase()}
        </div>
        <h2 className="profile-username">{currentUser.username}</h2>
      </div>
      
      <div className="profile-stats">
        <div className="stats-row">
          <div className="stat-box">
            <span className="stat-value">{currentUser.typingStats?.bestWpm || 0}</span>
            <span className="stat-label">Best WPM</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">{currentUser.typingStats?.averageWpm?.toFixed(1) || 0}</span>
            <span className="stat-label">Avg WPM</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">{currentUser.typingStats?.totalRaces || 0}</span>
            <span className="stat-label">Races</span>
          </div>
        </div>
        <div className="stats-row">
          <div className="stat-box">
            <span className="stat-value">{currentUser.typingStats?.racesWon || 0}</span>
            <span className="stat-label">Wins</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">{currentUser.typingStats?.averageAccuracy?.toFixed(1) || 0}%</span>
            <span className="stat-label">Accuracy</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">{Math.floor((currentUser.typingStats?.totalTextTyped || 0) / 1000)}K</span>
            <span className="stat-label">Characters</span>
          </div>
        </div>
      </div>
      
      <div className="profile-section">
        <h3>Account Info</h3>
        <div className="info-row">
          <span className="info-label">Email:</span>
          <span className="info-value">{currentUser.email}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Joined:</span>
          <span className="info-value">{formatDate(currentUser.joined)}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Last Login:</span>
          <span className="info-value">{formatDate(currentUser.lastLogin)}</span>
        </div>
      </div>
      
      <div className="profile-section">
        <h3>Edit Profile</h3>
        {error && <div className="profile-error">{error}</div>}
        {success && <div className="profile-success">{success}</div>}
        
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="displayName">Display Name</label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={profileData.displayName}
              onChange={handleChange}
              placeholder="Your display name"
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="avatarColor">Avatar Color</label>
            <input
              type="color"
              id="avatarColor"
              name="avatarColor"
              value={profileData.avatarColor}
              onChange={handleChange}
              disabled={loading}
              className="color-picker"
            />
          </div>
          
          <div className="profile-actions">
            <button 
              type="submit" 
              className="profile-button" 
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            
            <button 
              type="button" 
              className="profile-button refresh-button" 
              onClick={handleRefreshProfile}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh Profile'}
            </button>
            
            <button 
              type="button" 
              className="profile-button logout-button" 
              onClick={logout}
              disabled={loading}
            >
              Logout
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserProfile; 