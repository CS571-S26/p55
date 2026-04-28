import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../config/api';

const ProfileMain = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Change password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setPasswordLoading(true);

    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        setPasswordError('Authentication required');
        setPasswordLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ newPassword })
      });

      const data = await response.json();

      if (response.status === 401) {
        setPasswordError('Your session has expired. Please log in again.');
        handleLogout();
        return;
      }

      if (!response.ok) {
        setPasswordError(data.error || 'Failed to change password');
        return;
      }

      setMessage('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordModal(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setPasswordError('Error changing password: ' + err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/profile/login');
  };

  if (!user) {
    return (
      <div className="p-4">
        <h2>Profile</h2>
        <div className="alert alert-info mb-4">
          Please sign in to view your profile.
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-primary"
            onClick={() => navigate('/profile/login')}
          >
            Log In
          </button>
          <button
            className="btn btn-outline-primary"
            onClick={() => navigate('/profile/signup')}
          >
            Sign Up
          </button>
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
        <button
          className="btn btn-warning"
          onClick={() => setShowPasswordModal(true)}
        >
          🔐 Change Password
        </button>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Change Password</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordError('');
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                ></button>
              </div>
              <form onSubmit={handleChangePassword}>
                <div className="modal-body">
                  {passwordError && (
                    <div className="alert alert-danger" role="alert" aria-live="polite">
                      {passwordError}
                    </div>
                  )}
                  <div className="mb-3">
                    <label htmlFor="newPassword" className="form-label">New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      disabled={passwordLoading}
                      aria-required="true"
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                    <input
                      type="password"
                      className="form-control"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={passwordLoading}
                      aria-required="true"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordError('');
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    disabled={passwordLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={passwordLoading}
                  >
                    {passwordLoading ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Logout */}
      <button className="btn btn-danger" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
};

export default ProfileMain;
