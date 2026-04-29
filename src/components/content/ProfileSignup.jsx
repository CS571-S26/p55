import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../config/api';

const ProfileSignup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Sign up failed');
        return;
      }

      // Store user data from backend
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        console.log('User created:', data.user);
        
        // If access token is available, store it (for immediate login)
        if (data.access_token) {
          const tokenSize = data.access_token.length;
          console.log('🔐 Auth Token Size:', tokenSize, 'characters');
          console.log('✅ Token size is reasonable:', tokenSize < 2000 ? 'Yes' : 'No');
          localStorage.setItem('authToken', data.access_token);
        }
        
        console.log('Stored in localStorage:', {
          user: data.user,
          hasToken: !!data.access_token
        });
      } else {
        throw new Error('Missing user data in response');
      }

      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setSuccess('Check your email to confirm your account before logging in!');

      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/profile/login');
      }, 2000);
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1>Sign Up</h1>
      {error && <div className="alert alert-danger" role="alert" aria-live="polite">{error}</div>}
      {success && <div className="alert alert-success" role="alert" aria-live="polite">{success}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="signupEmail" className="form-label">Email address <span aria-label="required">*</span></label>
          <input
            type="email"
            className="form-control"
            id="signupEmail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            aria-required="true"
          />
        </div>
        <div className="mb-3">
          <label htmlFor="signupPassword" className="form-label">Password <span aria-label="required">*</span></label>
          <input
            type="password"
            className="form-control"
            id="signupPassword"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            aria-required="true"
          />
        </div>
        <div className="mb-3">
          <label htmlFor="confirmPassword" className="form-label">Confirm Password <span aria-label="required">*</span></label>
          <input
            type="password"
            className="form-control"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
            aria-required="true"
          />
        </div>
        <button
          type="submit"
          className="btn btn-success"
          disabled={loading}
        >
          {loading ? 'Signing Up...' : 'Sign Up'}
        </button>
      </form>
      <div className="mt-3 text-center">
        <p className="mb-0">Already have an account?</p>
        <button
          type="button"
          className="btn btn-link"
          onClick={() => navigate('/profile/login')}
        >
          Log In
        </button>
      </div>
    </div>
  );
};

export default ProfileSignup;
