import React, { useState, useEffect } from 'react';

const ProfileMain = () => {
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState({
    budget: 'Moderate',
    travelStyle: 'Balanced',
    pace: 'Moderate',
    duration: '7-10',
    interests: [],
    accessibility: [],
  });
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(false);

  // Accessibility options
  const accessibilityOptions = [
    'Mobility assistance',
    'Hearing assistance',
    'Visual assistance'
  ];

  // Interest options
  const interestOptions = [
    'Adventure', 'Culture', 'Food', 'Nature', 'History',
    'Beaches', 'Mountains', 'Museums', 'Nightlife', 'Shopping'
  ];

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    setIsLoadingPreferences(true);
    if (!user) return;

    // Fetch preferences from database if logged in
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
      const fetchPreferences = async () => {
        try {
          const response = await fetch('http://localhost:5001/api/user/preferences', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            }
          });

          if (response.status === 401) {
            handleUnauthorized();
            return;
          }

          if (response.ok) {
            const data = await response.json();
            setPreferences(data);
          } else {
            // Fall back to localStorage if API call fails
            const savedPrefs = localStorage.getItem('travelPreferences');
            if (savedPrefs) {
              setPreferences(JSON.parse(savedPrefs));
            }
          }
        } catch (err) {
          console.error('Error fetching preferences:', err);
          // Fall back to localStorage if fetch fails
          const savedPrefs = localStorage.getItem('travelPreferences');
          if (savedPrefs) {
            setPreferences(JSON.parse(savedPrefs));
          }
        } finally {
          setIsLoadingPreferences(false);
        }
      };

      fetchPreferences();
    }
  }, [user]);

  const handlePreferenceChange = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInterestToggle = (interest) => {
    setPreferences(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleAccessibilityToggle = (option) => {
    setPreferences(prev => ({
      ...prev,
      accessibility: prev.accessibility.includes(option)
        ? prev.accessibility.filter(a => a !== option)
        : [...prev.accessibility, option]
    }));
  };

  const handleSavePreferences = async () => {
    setLoading(true);
    setMessage('');

    try {
      // Save to localStorage
      localStorage.setItem('travelPreferences', JSON.stringify(preferences));
      
      // Save to backend/Supabase
      const authToken = localStorage.getItem('authToken');
      if (authToken) {
        const response = await fetch('http://localhost:5001/api/user/preferences', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(preferences)
        });

        if (response.status === 401) {
          handleUnauthorized();
          return;
        }

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to save preferences');
        }
      }

      setMessage('Preferences saved successfully!');
      setIsEditing(false);
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      setMessage('Error saving preferences: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/p55/profile/login';
  };

  const handleUnauthorized = () => {
    // Auto-logout on 401 Unauthorized
    setMessage('Your session has expired. Please log in again.');
    handleLogout();
  };

  if (!user) {
    return (
      <div className="p-4">
        <h2>Profile</h2>
        <div className="alert alert-info mb-4">
          Please sign in to view your profile and manage your travel preferences.
        </div>
        <div className="d-flex gap-2">
          <a href="/p55/profile/login" className="btn btn-primary">
            Log In
          </a>
          <a href="/p55/profile/signup" className="btn btn-outline-primary">
            Sign Up
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2>My Profile</h2>

      {message && (
        <div className={`alert ${message.includes('Error') ? 'alert-danger' : 'alert-success'}`}>
          {message}
        </div>
      )}

      {/* User Email */}
      <div className="mb-4 p-3 border rounded">
        <h5>Account Information</h5>
        <div className="mb-3">
          <label className="form-label"><strong>Email:</strong></label>
          <p className="form-control-plaintext">{user.email}</p>
        </div>
      </div>

      {/* Travel Preferences */}
      <div className="mb-4 p-3 border rounded">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5>Travel Preferences</h5>
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={() => setIsEditing(!isEditing)}
            disabled={isLoadingPreferences}
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {isLoadingPreferences ? (
          <div className="d-flex justify-content-center align-items-center py-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading preferences...</span>
            </div>
          </div>
        ) : isEditing ? (
          <>
            {/* Budget */}
            <div className="mb-3">
              <label htmlFor="budget" className="form-label"><strong>Budget Level:</strong></label>
              <select
                id="budget"
                className="form-select"
                value={preferences.budget}
                onChange={(e) => handlePreferenceChange('budget', e.target.value)}
              >
                <option value="Budget">Budget</option>
                <option value="Moderate">Moderate</option>
                <option value="Luxury">Luxury</option>
              </select>
            </div>

            {/* Travel Style */}
            <div className="mb-3">
              <label htmlFor="style" className="form-label"><strong>Travel Style:</strong></label>
              <select
                id="style"
                className="form-select"
                value={preferences.travelStyle}
                onChange={(e) => handlePreferenceChange('travelStyle', e.target.value)}
              >
                <option value="Adventure">Adventure</option>
                <option value="Relaxation">Relaxation</option>
                <option value="Cultural">Cultural</option>
                <option value="Balanced">Balanced</option>
              </select>
            </div>

            {/* Pace */}
            <div className="mb-3">
              <label htmlFor="pace" className="form-label"><strong>Travel Pace:</strong></label>
              <select
                id="pace"
                className="form-select"
                value={preferences.pace}
                onChange={(e) => handlePreferenceChange('pace', e.target.value)}
              >
                <option value="Slow">Slow (stay longer in fewer places)</option>
                <option value="Moderate">Moderate (balanced)</option>
                <option value="Fast">Fast (see many places)</option>
              </select>
            </div>

            {/* Duration */}
            <div className="mb-3">
              <label htmlFor="duration" className="form-label"><strong>Typical Trip Duration:</strong></label>
              <select
                id="duration"
                className="form-select"
                value={preferences.duration}
                onChange={(e) => handlePreferenceChange('duration', e.target.value)}
              >
                <option value="3-5">3-5 days</option>
                <option value="7-10">7-10 days</option>
                <option value="2-3">2-3 weeks</option>
                <option value="1+">1+ month</option>
              </select>
            </div>

            {/* Interests */}
            <div className="mb-3">
              <label className="form-label"><strong>Interests:</strong></label>
              <div className="d-flex flex-wrap gap-2">
                {interestOptions.map(interest => (
                  <button
                    key={interest}
                    type="button"
                    className={`btn btn-sm ${
                      preferences.interests.includes(interest)
                        ? 'btn-primary'
                        : 'btn-outline-primary'
                    }`}
                    onClick={() => handleInterestToggle(interest)}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            {/* Accessibility */}
            <div className="mb-3">
              <label className="form-label"><strong>Accessibility Needs:</strong></label>
              <div className="d-flex flex-wrap gap-2">
                {accessibilityOptions.map(option => (
                  <button
                    key={option}
                    type="button"
                    className={`btn btn-sm ${
                      preferences.accessibility.includes(option)
                        ? 'btn-primary'
                        : 'btn-outline-primary'
                    }`}
                    onClick={() => handleAccessibilityToggle(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="btn btn-success"
              onClick={handleSavePreferences}
              disabled={loading || !user}
            >
              {loading ? 'Saving...' : 'Save Preferences'}
            </button>
          </>
        ) : (
          <>
            <div className="row">
              <div className="col-md-6">
                <p><strong>Budget:</strong> {preferences.budget}</p>
                <p><strong>Travel Style:</strong> {preferences.travelStyle}</p>
                <p><strong>Pace:</strong> {preferences.pace}</p>
              </div>
              <div className="col-md-6">
                <p><strong>Duration:</strong> {preferences.duration} days</p>
                {preferences.accessibility.length > 0 && (
                  <p><strong>Accessibility:</strong> {preferences.accessibility.join(', ')}</p>
                )}
              </div>
            </div>
            {preferences.interests.length > 0 && (
              <p>
                <strong>Interests:</strong> {preferences.interests.join(', ')}
              </p>
            )}
          </>
        )}
      </div>

      {/* Logout */}
      <button className="btn btn-danger" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
};

export default ProfileMain;
