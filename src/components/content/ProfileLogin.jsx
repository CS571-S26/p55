import React from 'react';

const ProfileLogin = () => (
  <div className="p-4">
    <h2>Log In</h2>
    <form>
      <div className="mb-3">
        <label htmlFor="loginEmail" className="form-label">Email address</label>
        <input type="email" className="form-control" id="loginEmail" required />
      </div>
      <div className="mb-3">
        <label htmlFor="loginPassword" className="form-label">Password</label>
        <input type="password" className="form-control" id="loginPassword" required />
      </div>
      <button type="submit" className="btn btn-primary">Log In</button>
    </form>
  </div>
);

export default ProfileLogin;
