import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { config } from '../config/env';

// Create the context
const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authToken, setAuthToken] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  
  useEffect(() => {
    // Check for existing auth token in localStorage
    const savedToken = localStorage.getItem('speedtype_auth_token');
    const savedUser = localStorage.getItem('speedtype_user');
    
    if (savedToken && savedUser) {
      try {
        setAuthToken(savedToken);
        setCurrentUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        // Clear invalid storage data
        localStorage.removeItem('speedtype_auth_token');
        localStorage.removeItem('speedtype_user');
      }
    }
    
    setLoading(false);
  }, []);
  
  // Register a new user
  const register = async (userData) => {
    try {
      const response = await fetch(`${config.BACKEND_URL}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      
      const data = await response.json();
      
      // Save auth token and user data
      localStorage.setItem('speedtype_auth_token', data.token);
      localStorage.setItem('speedtype_user', JSON.stringify(data.user));
      
      setAuthToken(data.token);
      setCurrentUser(data.user);
      setAuthModalOpen(false);
      
      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };
  
  // Login a user
  const login = async (credentials) => {
    try {
      const response = await fetch(`${config.BACKEND_URL}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      
      const data = await response.json();
      
      // Save auth token and user data
      localStorage.setItem('speedtype_auth_token', data.token);
      localStorage.setItem('speedtype_user', JSON.stringify(data.user));
      
      setAuthToken(data.token);
      setCurrentUser(data.user);
      setAuthModalOpen(false);
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };
  
  // Logout a user
  const logout = () => {
    localStorage.removeItem('speedtype_auth_token');
    localStorage.removeItem('speedtype_user');
    
    setAuthToken(null);
    setCurrentUser(null);
  };
  
  // Get user profile
  const getUserProfile = async () => {
    if (!authToken) return null;
    
    try {
      const response = await fetch(`${config.BACKEND_URL}/api/users/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          logout();
          throw new Error('Session expired. Please login again.');
        }
        throw new Error('Failed to fetch profile');
      }
      
      const data = await response.json();
      
      // Update user data
      localStorage.setItem('speedtype_user', JSON.stringify(data.user));
      setCurrentUser(data.user);
      
      return data.user;
    } catch (error) {
      console.error('Profile fetch error:', error);
      throw error;
    }
  };
  
  // Update user profile
  const updateProfile = async (profileData) => {
    if (!authToken) throw new Error('Not authenticated');
    
    try {
      const response = await fetch(`${config.BACKEND_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(profileData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Profile update failed');
      }
      
      const data = await response.json();
      
      // Update user data
      localStorage.setItem('speedtype_user', JSON.stringify(data.user));
      setCurrentUser(data.user);
      
      return data.user;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };
  
  // Get auth header for API requests
  const getAuthHeader = () => {
    return authToken ? { Authorization: `Bearer ${authToken}` } : {};
  };
  
  // Toggle auth modal
  const toggleAuthModal = () => setAuthModalOpen(prev => !prev);
  
  // Context value
  const value = {
    currentUser,
    loading,
    authToken,
    authModalOpen,
    register,
    login,
    logout,
    getUserProfile,
    updateProfile,
    getAuthHeader,
    toggleAuthModal,
    setAuthModalOpen
  };
  
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export default AuthContext; 