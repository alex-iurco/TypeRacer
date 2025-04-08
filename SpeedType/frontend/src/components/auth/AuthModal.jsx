import { useState } from 'react';
import PropTypes from 'prop-types';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import './AuthForms.css';

const AuthModal = ({ isOpen, onClose, onLogin, onRegister }) => {
  const [formType, setFormType] = useState('login'); // 'login' or 'register'
  
  // Handle switching between forms
  const switchToLogin = () => setFormType('login');
  const switchToRegister = () => setFormType('register');
  
  // Stop propagation on modal click to prevent closing
  const handleModalClick = (e) => {
    e.stopPropagation();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={handleModalClick}>
        <button className="auth-modal-close" onClick={onClose}>×</button>
        
        {formType === 'login' ? (
          <LoginForm 
            onLogin={onLogin} 
            switchToRegister={switchToRegister} 
          />
        ) : (
          <RegisterForm 
            onRegister={onRegister} 
            switchToLogin={switchToLogin} 
          />
        )}
      </div>
    </div>
  );
};

AuthModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onLogin: PropTypes.func.isRequired,
  onRegister: PropTypes.func.isRequired
};

export default AuthModal; 