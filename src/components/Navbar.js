import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import './Navbar.css';

const Navbar = () => {
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const location = useLocation();
  const { logout, currentUser, userProfile } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const profileMenuRef = useRef(null);
  
  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);
  
  // Debug logging for balance updates
  console.log('Navbar userProfile:', userProfile);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getInitials = (email) => {
    return email ? email.substring(0, 2).toUpperCase() : 'U';
  };

  const handleDateFilter = () => {
    if (startDate && endDate) {
      // Redirect to expenses page with date filter
      const params = new URLSearchParams();
      params.set('startDate', startDate);
      params.set('endDate', endDate);
      window.location.href = `/expenses?${params.toString()}`;
    }
  };

  return (
    <motion.nav 
      className="navbar"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            💰 Expense Tracker
          </motion.div>
        </Link>
        
        <div className="nav-center">
          <div className="nav-links">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                📊 Dashboard
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/add-expense" className={location.pathname === '/add-expense' ? 'active' : ''}>
                ➕ Add Expense
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/expenses" className={location.pathname === '/expenses' ? 'active' : ''}>
                📋 Expenses
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/reports" className={location.pathname === '/reports' ? 'active' : ''}>
                📈 Reports
              </Link>
            </motion.div>
            
            <motion.button 
              className="date-filter-btn"
              onClick={() => setShowDateFilter(!showDateFilter)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🗓️ Filter by Date
            </motion.button>
          </div>
        </div>

        {/* User Profile Section */}
        <div className="nav-profile">
          {userProfile && (
            <motion.div 
              className="balance-display"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              Balance: <span className="balance-amount">₹{userProfile.currentBalance?.toFixed(2) || '0.00'}</span>
            </motion.div>
          )}
          
          <div 
            ref={profileMenuRef}
            className="profile-dropdown"
          >
            <motion.button
              className="profile-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowProfileMenu(!showProfileMenu);
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <div className="profile-avatar">
                {getInitials(currentUser?.email)}
              </div>
            </motion.button>

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  className="profile-menu"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  onMouseEnter={() => setShowProfileMenu(true)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="profile-info">
                    <div className="profile-header">
                      <div className="profile-avatar-large">
                        {getInitials(currentUser?.email)}
                      </div>
                      <div className="profile-details">
                        <p className="profile-email">{currentUser?.email}</p>
                        <p className="profile-balance">Balance: ₹{userProfile?.currentBalance?.toFixed(2) || '0.00'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="profile-divider"></div>
                  
                  <div className="profile-actions">
                    <motion.button
                      className="action-btn theme-toggle"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTheme();
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="action-icon">{isDarkMode ? '🌙' : '☀️'}</span>
                      <span className="action-text">{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
                      <div className="toggle-switch">
                        <div className={`toggle-slider ${isDarkMode ? 'active' : ''}`}></div>
                      </div>
                    </motion.button>
                    
                    <motion.button
                      className="action-btn logout-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowProfileMenu(false);
                        handleLogout();
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="action-icon">🚪</span>
                      <span className="action-text">Logout</span>
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      {showDateFilter && (
        <div className="date-filter-panel">
          <div className="date-inputs">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Start Date"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="End Date"
            />
            <button onClick={handleDateFilter} className="filter-apply-btn">
              Apply Filter
            </button>
          </div>
        </div>
      )}
    </motion.nav>
  );
};

export default Navbar;
