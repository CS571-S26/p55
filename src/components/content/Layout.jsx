import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar, Container } from 'react-bootstrap';
import logo from '../../assets/logo.png';
import NavTabs from './NavTabs';
import '../../css/Layout.css';

const Layout = () => (
  <>
    {/* Header with logo */}
    <Navbar bg="light" expand="md" className="tripgenie-navbar mb-0 w-100">
      <Container fluid className="justify-content-center">
        <Navbar.Brand className="d-flex align-items-center mx-auto tripgenie-navbar-brand">
          <img
            src={logo}
            alt="TripGenie Logo"
            className="tripgenie-logo me-2 tripgenie-navbar-logo"
          />
          <span className="tripgenie-navbar-title">Trip Genie</span>
        </Navbar.Brand>
      </Container>
    </Navbar>
    {/* Navigation Tabs */}
    <NavTabs />
    {/* Page Content */}
    <Outlet />
  </>
);

export default Layout;
