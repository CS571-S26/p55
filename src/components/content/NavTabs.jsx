import React from 'react';
import { Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import '../../css/NavTabs.css';

const tabs = [
  { to: '/', label: <><span role="img" aria-label="Home">🏠</span> Home</> },
  { to: '/mytrips', label: <><span role="img" aria-label="My Trips">🗺️</span> My Trips</> },
  { to: '/itinerary', label: <><span role="img" aria-label="Itinerary">🎒</span> Itinerary</> },
  { to: '/explore', label: <><span role="img" aria-label="Explore">🌍</span> Explore</> },
  { to: '/profile', label: <><span role="img" aria-label="Profile">👤</span> Profile</> },
];

const NavTabs = () => (
  <Nav variant="tabs" className="justify-content-center tripgenie-tabs mb-4">
    {tabs.map(tab => (
      <Nav.Item key={tab.to}>
        <NavLink
          to={tab.to}
          className={({ isActive }) =>
            'nav-link' + (isActive ? ' active tripgenie-tab-active' : '')
          }
        >
          {tab.label}
        </NavLink>
      </Nav.Item>
    ))}
  </Nav>
);

export default NavTabs;
