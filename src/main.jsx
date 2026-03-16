import React from 'react';
import ReactDOM from 'react-dom/client';
import HomePage from './components/content/HomePage';
import 'bootstrap/dist/css/bootstrap.min.css';
import './css/HomePage.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <HomePage />
  </React.StrictMode>
);
