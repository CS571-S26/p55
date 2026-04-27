import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../config/api';

const ProfileLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const syncLocalStorageToDatabase = async (authToken) => {
    try {
      // Get saved trips from localStorage
      const savedTrips = JSON.parse(localStorage.getItem('savedTrips') || '[]');
      
      // Get saved itineraries from localStorage
      const savedItineraries = JSON.parse(localStorage.getItem('savedItineraries') || '[]');

      // Sync trips to database
      for (const trip of savedTrips) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/user/trips`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(trip)
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.warn('Failed to sync trip:', errorData);
            // Continue with other trips even if one fails
          }
        } catch (tripError) {
          console.error('Error syncing trip:', tripError);
        }
      }

      // Sync itineraries to database
      for (const itinerary of savedItineraries) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/user/itineraries`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(itinerary)
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.warn('Failed to sync itinerary:', errorData);
            // Continue with other itineraries even if one fails
          }
        } catch (itineraryError) {
          console.error('Error syncing itinerary:', itineraryError);
        }
      }

      console.log('Sync completed: ' + savedTrips.length + ' trips and ' + savedItineraries.length + ' itineraries synced');
    } catch (err) {
      console.error('Error during sync:', err);
      // Don't throw error - sync is non-critical
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('Response received:', data); // Log the full response to debug

      if (!response.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      // Store JWT token from Supabase session
      if (data.session?.access_token) {
        localStorage.setItem('authToken', data.session.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        console.log('Logged in:', data.user);

        // Sync localStorage data to database
        await syncLocalStorageToDatabase(data.session.access_token);
      }

      setEmail('');
      setPassword('');
      setSuccess('Logged in successfully!');

      // Redirect after a short delay using React Router
      setTimeout(() => {
        navigate('/profile');
      }, 1000);
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1>Log In</h1>
      {error && <div className="alert alert-danger" role="alert" aria-live="polite">{error}</div>}
      {success && <div className="alert alert-success" role="alert" aria-live="polite">{success}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="loginEmail" className="form-label">Email address <span aria-label="required">*</span></label>
          <input
            type="email"
            className="form-control"
            id="loginEmail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            aria-required="true"
          />
        </div>
        <div className="mb-3">
          <label htmlFor="loginPassword" className="form-label">Password <span aria-label="required">*</span></label>
          <input
            type="password"
            className="form-control"
            id="loginPassword"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            aria-required="true"
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Logging In...' : 'Log In'}
        </button>
      </form>
      <div className="mt-3 text-center">
        <p className="mb-0">Don't have an account?</p>
        <button
          type="button"
          className="btn btn-link"
          onClick={() => navigate('/profile/signup')}
        >
          Sign Up
        </button>
      </div>
    </div>
  );
};

export default ProfileLogin;
