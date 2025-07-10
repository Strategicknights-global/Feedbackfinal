// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import LoginPage from './components/LoginPage';
import AdminPanel from './components/AdminPanel';
import UnifiedFeedbackForm from './components/UnifiedFeedbackForm';
import ProtectedRoute from './components/ProtectedRoute';
import logo from './assets/logo.png'; // Import the logo

function Navigation() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const ADMIN_EMAIL = "admin@gmail.com"; 

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <header className="main-nav">
      <div className="logo">
        <img src={logo} alt="Portal Logo" /> {/* Use the imported logo */}
        <span>Student Feedback Portal</span>
      </div>
      <div className="nav-links">
        {currentUser && (
          currentUser.email === ADMIN_EMAIL ? (
            <NavLink to="/admin" className="nav-link">Admin Panel</NavLink>
          ) : (
            <NavLink to="/form" className="nav-link">Feedback Form</NavLink>
          )
        )}
        {currentUser && (
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        )}
      </div>
    </header>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navigation />
        <main className="app-container">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
            <Route path="/form" element={<ProtectedRoute><UnifiedFeedbackForm /></ProtectedRoute>} />
            <Route path="/" element={<ProtectedRoute><UnifiedFeedbackForm /></ProtectedRoute>} />
          </Routes>
        </main>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
