// src/components/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { FaSignInAlt } from 'react-icons/fa'; // Import icon

// Import your CSS file for the login page
import './LoginPage.css'; // Make sure this path is correct

const ADMIN_EMAIL = "admin@gmail.com";

function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, loginWithRollNumber } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(''); // Clear previous errors
    try {
      let userCredential;
      if (identifier.includes('@')) {
        // Assume email login if it contains '@'
        userCredential = await login(identifier, password);
      } else {
        // Otherwise, attempt login with roll number (and the provided password)
        userCredential = await loginWithRollNumber(identifier, password); // Pass password here too
      }

      if (userCredential.user.email === ADMIN_EMAIL) {
        navigate('/admin');
      } else {
        navigate('/form');
      }
    } catch (err) {
      console.error("Login error: ", err); // Log the full error for debugging
      setError(err.message || 'Failed to log in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper"> {/* Wrapper for full page background */}
      <div className="login-container">
        <div className="login-card">
          <h1 className="login-title">Portal Login</h1>
          {error && <p className="error-message">{error}</p>} {/* Apply a class for error messages */}
          <form onSubmit={handleSubmit} className="login-form"> {/* Apply a class for the form */}
            <div className="form-group">
              <label htmlFor="identifier">Roll Number</label>
              <input
                type="text"
                id="identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="form-input"
                placeholder="Your email or roll number"
                required
                aria-label="Enter your email or roll number"
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="Your password (often your roll number)"
                required
                aria-label="Enter your password"
              />
            </div>
            <button type="submit" disabled={loading} className="btn btn-login-primary">
              {loading ? 'Logging In...' : <><FaSignInAlt /> Log In</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;