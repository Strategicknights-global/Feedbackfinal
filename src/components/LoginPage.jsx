// src/components/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { FaSignInAlt } from 'react-icons/fa'; // Import icon

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
    setError('');
    try {
      let userCredential;
      if (identifier.includes('@')) {
        userCredential = await login(identifier, password);
      } else {
        userCredential = await loginWithRollNumber(identifier);
      }
      if (userCredential.user.email === ADMIN_EMAIL) {
        navigate('/admin');
      } else {
        navigate('/form');
      }
    } catch (err) {
      setError(err.message || 'Failed to log in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="page-title" style={{ marginBottom: '2rem' }}>Portal Login</h1>
        {error && <p style={{color: 'red', textAlign: 'center', marginBottom: '1rem'}}>{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="form-group">
            <label htmlFor="identifier">Roll Number / Email</label>
            <input type="text" id="identifier" value={identifier} onChange={(e) => setIdentifier(e.target.value)}
              className="form-input" placeholder="Enter email or roll number" required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="form-input" placeholder="Password is your roll number" required />
          </div>
          <div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Logging in...' : <><FaSignInAlt /> Log In</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;