import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/content/Layout';
import HomePage from './components/content/HomePage';
import MyTrips from './components/content/MyTrips';
import Explore from './components/content/Explore';
import ProfileMain from './components/content/ProfileMain';
import ProfileLogin from './components/content/ProfileLogin';
import ProfileSignup from './components/content/ProfileSignup';
import 'bootstrap/dist/css/bootstrap.min.css';
import './css/HomePage.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="mytrips" element={<MyTrips />} />
          <Route path="explore" element={<Explore />} />
          <Route path="profile" element={<ProfileMain />} />
          <Route path="profile/login" element={<ProfileLogin />} />
          <Route path="profile/signup" element={<ProfileSignup />} />
        </Route>
        {/* Redirect any unknown route to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>
);
