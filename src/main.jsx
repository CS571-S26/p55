import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/content/Layout';
import HomePage from './components/content/HomePage';
import MyTrips from './components/content/MyTrips';
import Explore from './components/content/Explore';
import Profile from './components/content/Profile';
import ProfileMain from './components/content/ProfileMain';
import ProfileLogin from './components/content/ProfileLogin';
import ProfileSignup from './components/content/ProfileSignup';
import 'bootstrap/dist/css/bootstrap.min.css';
import './css/HomePage.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter basename="/p55/">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="mytrips" element={<MyTrips />} />
          <Route path="explore" element={<Explore />} />
          <Route path="profile" element={<Profile />}>
            <Route index element={<ProfileMain />} />
            <Route path="login" element={<ProfileLogin />} />
            <Route path="signup" element={<ProfileSignup />} />
          </Route>
        </Route>
        {/* Redirect any unknown route to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
