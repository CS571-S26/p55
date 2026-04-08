import React from 'react';

const ProfileSignup = () => (
  <div className="p-4">
    <h2>Sign Up</h2>
    <form>
      <div className="mb-3">
        <label htmlFor="signupEmail" className="form-label">Email address</label>
        <input type="email" className="form-control" id="signupEmail" required />
      </div>
      <div className="mb-3">
        <label htmlFor="signupPassword" className="form-label">Password</label>
        <input type="password" className="form-control" id="signupPassword" required />
      </div>
      <button type="submit" className="btn btn-success">Sign Up</button>
    </form>
  </div>
);

export default ProfileSignup;
