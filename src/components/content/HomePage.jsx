

import React, { useState } from 'react';
import { Container, Row, Col, Button, Navbar, Modal } from 'react-bootstrap';




const HomePage = () => {
	const [showModal, setShowModal] = useState(true);

	const handleClose = () => setShowModal(false);
	const handleSignIn = () => {
		// Add sign-in logic here
		setShowModal(false);
	};
	const handleLogin = () => {
		// Add login logic here
		setShowModal(false);
	};

		return (
			<>


				<div className="tripgenie-home-bg">
					<Container className="tripgenie-home-container">
						<Row className="justify-content-center align-items-center min-vh-100">
							<Col md={8} lg={6} className="text-center">
								<p className="tripgenie-subtitle mb-4">
									Your AI-powered trip planner. Effortlessly create, customize, and optimize your travel adventures with the help of artificial intelligence!
								</p>
								<Button variant="primary" size="lg" className="tripgenie-get-started" onClick={() => setShowModal(true)}>
									Get Started
								</Button>
							</Col>
						</Row>
					</Container>

					{/* Modal for Welcome and Sign-in/Login */}
					<Modal show={showModal} onHide={handleClose} centered>
						<Modal.Header closeButton>
							<Modal.Title>Welcome to TripGenie</Modal.Title>
						</Modal.Header>
						<Modal.Body className="text-center">
							<p>Sign in or log in to get started planning your next adventure!</p>
							<Button variant="success" className="me-2" onClick={handleSignIn}>
								Sign Up
							</Button>
							<Button variant="outline-primary" onClick={handleLogin}>
								Log In
							</Button>
						</Modal.Body>
						<Modal.Footer>
							<Button variant="secondary" onClick={handleClose}>
								Close
							</Button>
						</Modal.Footer>
					</Modal>
				</div>
			</>
		);
};

export default HomePage;
