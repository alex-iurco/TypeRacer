import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AuthModal from './AuthModal';
import './UserMenu.css';

const UserMenu = () => {
  const { currentUser, logout, toggleAuthModal, authModalOpen } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  
  const handleLogin = async (credentials) => {
    try {
      await useAuth().login(credentials);
      return true;
    } catch (error) {
      throw error;
    }
  };
  
  const handleRegister = async (userData) => {
    try {
      await useAuth().register(userData);
      return true;
    } catch (error) {
      throw error;
    }
  };
  
  const toggleMenu = () => {
    setMenuOpen(prev => !prev);
  };
  
  const closeMenu = () => {
    setMenuOpen(false);
  };
  
  return (
    <>
      <div className="user-menu-container">
        {currentUser ? (
          <>
            <button className="user-button" onClick={toggleMenu}>
              <div 
                className="user-avatar" 
                style={{ backgroundColor: currentUser.avatarColor || '#4169e1' }}
              >
                {(currentUser.displayName || currentUser.username || '').charAt(0).toUpperCase()}
              </div>
              <span className="user-name">{currentUser.displayName || currentUser.username}</span>
            </button>
            
            {menuOpen && (
              <div className="user-dropdown">
                <div className="dropdown-header">
                  <div 
                    className="dropdown-avatar"
                    style={{ backgroundColor: currentUser.avatarColor || '#4169e1' }}
                  >
                    {(currentUser.displayName || currentUser.username || '').charAt(0).toUpperCase()}
                  </div>
                  <div className="dropdown-user-info">
                    <div className="dropdown-username">{currentUser.username}</div>
                    <div className="dropdown-email">{currentUser.email}</div>
                  </div>
                </div>
                
                <div className="dropdown-stats">
                  <div className="dropdown-stat">
                    <div className="dropdown-stat-value">{currentUser.typingStats?.bestWpm || 0}</div>
                    <div className="dropdown-stat-label">Best WPM</div>
                  </div>
                  <div className="dropdown-stat">
                    <div className="dropdown-stat-value">{currentUser.typingStats?.totalRaces || 0}</div>
                    <div className="dropdown-stat-label">Races</div>
                  </div>
                  <div className="dropdown-stat">
                    <div className="dropdown-stat-value">{currentUser.typingStats?.racesWon || 0}</div>
                    <div className="dropdown-stat-label">Wins</div>
                  </div>
                </div>
                
                <div className="dropdown-menu">
                  <a href="/profile" className="dropdown-item" onClick={closeMenu}>
                    <i className="fas fa-user"></i> Profile
                  </a>
                  <a href="/stats" className="dropdown-item" onClick={closeMenu}>
                    <i className="fas fa-chart-line"></i> Statistics
                  </a>
                  <a href="/history" className="dropdown-item" onClick={closeMenu}>
                    <i className="fas fa-history"></i> Race History
                  </a>
                  <button className="dropdown-item logout-item" onClick={logout}>
                    <i className="fas fa-sign-out-alt"></i> Logout
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="auth-buttons">
            <button className="login-button" onClick={toggleAuthModal}>
              Login
            </button>
            <button className="signup-button" onClick={toggleAuthModal}>
              Sign Up
            </button>
          </div>
        )}
      </div>
      
      <AuthModal
        isOpen={authModalOpen}
        onClose={toggleAuthModal}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    </>
  );
};

export default UserMenu; 