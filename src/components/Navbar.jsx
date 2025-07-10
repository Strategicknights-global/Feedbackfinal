// src/components/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';
import { FaSlidersH, FaSignOutAlt, FaClipboardList } from 'react-icons/fa'; // Import icons

const Navbar = () => {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo-container">
        <img src={logo} alt="Institution Logo" className="navbar-logo" />
        <span className="navbar-title">Student Feedback Portal</span>
      </div>
      {currentUser && (
        <div className="navbar-links">
          {userRole === 'admin' && (
            <Link to="/admin" className="navbar-link">
              <FaSlidersH /> Admin Panel
            </Link>
          )}
          {userRole === 'user' && (
            <Link to="/feedback" className="navbar-link">
              <FaClipboardList /> Feedback Form
            </Link>
          )}
          <button onClick={handleLogout} className="logout-button">
            <FaSignOutAlt /> Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;