
import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';

import logo from '../../assets/logo.png';
import '../../css/HomePage.css';

const HomePage = () => {
	return (
		<div className="tripgenie-home-bg">
			<Container className="tripgenie-home-container">
				<Row className="justify-content-center align-items-center min-vh-100">
					<Col md={8} lg={6} className="text-center">
						<img src={logo} alt="TripGenie Logo" className="tripgenie-logo mb-4" />
						<h1 className="tripgenie-title">Welcome to TripGenie</h1>
						<p className="tripgenie-subtitle mb-4">
							Your AI-powered trip planner. Effortlessly create, customize, and optimize your travel adventures with the help of artificial intelligence!
						</p>
						<Button variant="primary" size="lg" className="tripgenie-get-started">Get Started</Button>
					</Col>
				</Row>
			</Container>
		</div>
	);
};

export default HomePage;
