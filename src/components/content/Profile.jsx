import React from 'react';
import { Outlet } from 'react-router-dom';

const Profile = () => (
  <div className="p-4">
    <Outlet />
  </div>
);

export default Profile;
