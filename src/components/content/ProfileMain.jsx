import React, { useState, useEffect } from 'react';

const ProfileMain = () => {
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState({
    budget: 'moderate',
    travelStyle: 'balanced',
    pace: 'moderate',
    duration: '7-10',
    interests: [],
    accessibility: 'none',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Interest options
  const interestOptions = [
    'Adventure', 'Culture', 'Food', 'Nature', 'History',
    'beaches', 'mountains', 'museums', 'nightlife', 'shopping'
  ];

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Load saved preferences from localStorage
    const savedPrefs = localStorage.getItem('travelPreferences');
    if (savedPrefs) {
      setPreferences(JSON.parse(savedPrefs));
    }
  }, []);

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

  if (!user) {
    return (
      <div className="p-4">
        <h2>Profile</h2>
        <div className="alert alert-info">
          Please <a href="/p55/profile/login">log in</a> to view your profile.
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
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {isEditing ? (
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
                <option value="budget">Budget</option>
                <option value="moderate">Moderate</option>
                <option value="luxury">Luxury</option>
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
                <option value="adventure">Adventure</option>
                <option value="relaxation">Relaxation</option>
                <option value="cultural">Cultural</option>
                <option value="balanced">Balanced</option>
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
                <option value="slow">Slow (stay longer in fewer places)</option>
                <option value="moderate">Moderate (balanced)</option>
                <option value="fast">Fast (see many places)</option>
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
              <label htmlFor="accessibility" className="form-label"><strong>Accessibility Needs:</strong></label>
              <select
                id="accessibility"
                className="form-select"
                value={preferences.accessibility}
                onChange={(e) => handlePreferenceChange('accessibility', e.target.value)}
              >
                <option value="none">None</option>
                <option value="mobility">Mobility assistance</option>
                <option value="hearing">Hearing assistance</option>
                <option value="visual">Visual assistance</option>
              </select>
            </div>

            <button
              className="btn btn-success"
              onClick={handleSavePreferences}
              disabled={loading}
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
                <p><strong>Accessibility:</strong> {preferences.accessibility || 'None'}</p>
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
