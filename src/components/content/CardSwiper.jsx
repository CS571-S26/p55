import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Form, Spinner, Row, Col, Image } from 'react-bootstrap';
import PropTypes from 'prop-types';
import ImageCarousel from './ImageCarousel';

// Simple swipeable card stack for travel destinations
const CardSwiper = ({ destinations, initialIndex = 0, onIndexChange, onSwipeRight, onSwipeLeft, onReachedEnd }) => {
  const [current, setCurrent] = useState(initialIndex);
  const [showItineraryModal, setShowItineraryModal] = useState(false);
  const [itineraryInput, setItineraryInput] = useState('');
  const [itinerary, setItinerary] = useState('');
  const [itineraryItems, setItineraryItems] = useState([]);
  const [loadingItinerary, setLoadingItinerary] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [savingItinerary, setSavingItinerary] = useState(false);

  // Notify parent when current index changes
  useEffect(() => {
    if (onIndexChange) {
      onIndexChange(current);
    }
  }, [current, onIndexChange]);

  if (!destinations || destinations.length === 0) {
    return <div>No more destinations to show. Great job exploring!</div>;
  }

  const handleSwipe = (direction) => {
    if (direction === 'right') {
      const selectedItinerary = itineraryItems.filter(item => selectedItems.has(item.id));
      const enhancedDestination = {
        ...destinations[current],
        selectedItinerary: selectedItinerary
      };
      onSwipeRight(enhancedDestination);
    } else {
      onSwipeLeft(destinations[current]);
    }
    const nextIndex = current + 1;
    setCurrent(nextIndex);
    
    // If reached end and callback exists, call it to load more
    if (nextIndex >= destinations.length && onReachedEnd) {
      onReachedEnd();
    }
  };

  if (current >= destinations.length) {
    return <div>Loading more destinations...</div>;
  }

  const dest = destinations[current];

  const handleGenerateItinerary = async () => {
    setLoadingItinerary(true);
    try {
      const prompt = `Create a detailed itinerary for ${dest.city}, ${dest.country}. 
      The user's preferences: ${itineraryInput || 'General exploration'}.
      The destination is best for: ${dest.bestFor || 'General tourism'}.
      Ideal duration: ${dest.idealDuration || 'Flexible'}.
      Budget level: ${dest.budget || 'Not specified'}.

      Please provide a list of recommended activities, attractions, and things to do. 
      Return ONLY a valid JSON array with objects containing: title (string - activity name), location (string - specific attraction or landmark name), activities (array of strings with specific recommendations).
      Example: [{"title":"Explore the Eiffel Tower","location":"Eiffel Tower","activities":["Take the elevator to the top","Enjoy panoramic city views","Visit the gift shop"]},{"title":"Visit the Louvre Museum","location":"Louvre Museum","activities":["See the Mona Lisa","Browse classical sculptures","Explore Egyptian artifacts"]}]`;

      const res = await fetch('http://localhost:5001/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput: prompt,
          destinationsData: []
        })
      });

      if (!res.ok) throw new Error('Failed to generate itinerary');
      
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Parse itinerary into items and fetch images
      await parseAndEnhanceItinerary(text);
    } catch (e) {
      console.error('Error generating itinerary:', e);
      setItinerary('Failed to generate itinerary. Please try again.');
      setItineraryItems([]);
    }
    setLoadingItinerary(false);
  };

  const parseAndEnhanceItinerary = async (text) => {
    const stripMarkdown = (str) => {
      if (!str) return '';
      return str
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove **bold**
        .replace(/__(.*?)__/g, '$1') // Remove __bold__
        .replace(/\*(.*?)\*/g, '$1') // Remove *italic*
        .replace(/_(.*?)_/g, '$1') // Remove _italic_
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove [link](url)
        .replace(/^[-*] /gm, ''); // Remove list markers at start of lines
    };

    try {
      // Parse JSON response directly
      let items = [];
      try {
        items = JSON.parse(text);
      } catch {
        // Fallback: try to extract JSON from the text
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          items = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Could not parse itinerary JSON');
        }
      }

      // Enhance items without day structure
      const enhancedItems = await Promise.all(
        items.map(async (item, index) => {
          const cleanedActivities = (item.activities || []).map(activity => stripMarkdown(activity));
          return {
            id: index,
            title: stripMarkdown(item.title),
            description: cleanedActivities.join(' • '),
            activities: cleanedActivities,
            image: null,
            selected: true
          };
        })
      );

      setItineraryItems(enhancedItems);
      setSelectedItems(new Set(enhancedItems.map(item => item.id)));
      setItinerary('parsed'); // Mark as having valid itinerary
    } catch (e) {
      console.error('Error parsing itinerary:', e);
      setItinerary('');
      setItineraryItems([]);
    }
  };

  const handleToggleItem = (itemId) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleOpenItineraryModal = () => {
    setItineraryInput('');
    setItinerary('');
    setShowItineraryModal(true);
  };

  const handleCloseItineraryModal = () => {
    setShowItineraryModal(false);
  };

  const handleSaveItinerary = async () => {
    setSavingItinerary(true);
    try {
      const selectedItinerary = itineraryItems.filter(item => selectedItems.has(item.id));
      const enhancedDestination = {
        ...dest,
        selectedItinerary: selectedItinerary
      };

      const authToken = localStorage.getItem('authToken');
      
      if (authToken) {
        // Save to backend if logged in
        const response = await fetch('http://localhost:5001/api/user/trips', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(enhancedDestination)
        });

        if (!response.ok) {
          const data = await response.json();
          console.error('Failed to save itinerary:', data.error);
          alert('Failed to save itinerary. Please try again.');
          setSavingItinerary(false);
        } else {
          setShowItineraryModal(false);
          setSavingItinerary(false);
          // Move to next location like clicking the Save button
          handleSwipe('right');
        }
      } else {
        // Fallback to localStorage if not logged in
        const savedTrips = JSON.parse(localStorage.getItem('savedTrips') || '[]');
        const tripIndex = savedTrips.findIndex(trip => trip.city === dest.city && trip.country === dest.country);
        if (tripIndex >= 0) {
          savedTrips[tripIndex] = enhancedDestination;
        } else {
          savedTrips.push(enhancedDestination);
        }
        localStorage.setItem('savedTrips', JSON.stringify(savedTrips));
        setShowItineraryModal(false);
        setSavingItinerary(false);
        // Move to next location like clicking the Save button
        handleSwipe('right');
      }
    } catch (err) {
      console.error('Error saving itinerary:', err);
      alert('Failed to save itinerary. Please try again.');
      setSavingItinerary(false);
    }
  };

  return (
    <div className="d-flex flex-column align-items-center">
      <Card style={{ width: '22rem', minHeight: '32rem', cursor: 'pointer' }} className="mb-3 shadow" onClick={handleOpenItineraryModal}>
        <div onClick={(e) => e.stopPropagation()}>
          <ImageCarousel images={dest.images} />
        </div>
        <Card.Body>
          <Card.Title>{dest.city}{dest.state ? ', ' + dest.state : ''}, {dest.country}</Card.Title>
          {dest.region && <p style={{ fontSize: '0.85rem', color: '#666' }}>{dest.region.charAt(0).toUpperCase() + dest.region.slice(1).replace('_', ' ')}</p>}
          <Card.Text>{dest.description}</Card.Text>
          <ul className="text-start" style={{ fontSize: '0.95rem', lineHeight: '1.8' }}>
            {dest.budget && <li><b>Budget Level:</b> {dest.budget}</li>}
            {dest.bestFor && <li><b>Best For:</b> {dest.bestFor}</li>}
            {dest.idealDuration && <li><b>Ideal Duration:</b> {dest.idealDuration}</li>}
            {dest.attractions && <li><b>Top Attractions:</b> {dest.attractions}</li>}
          </ul>
          <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '10px' }}>Click to create an itinerary</p>
        </Card.Body>
      </Card>
      <div>
        <Button variant="danger" className="me-3" onClick={() => handleSwipe('left')}>❌ Discard</Button>
        <Button variant="success" onClick={() => handleSwipe('right')}>❤️ Save</Button>
      </div>

      {/* Itinerary Modal */}
      <Modal show={showItineraryModal} onHide={handleCloseItineraryModal} centered size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Create Your Itinerary - {dest.city}{dest.state ? ', ' + dest.state : ''}, {dest.country}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {!itinerary ? (
            <div>
              <Form.Group className="mb-3">
                <Form.Label><b>Describe what you would like to do:</b></Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="E.g., I have 5 days, love beach activities and local cuisine. I'm traveling with family and prefer a mix of relaxation and exploration on a mid-range budget."
                  value={itineraryInput}
                  onChange={(e) => setItineraryInput(e.target.value)}
                />
              </Form.Group>
              <Button 
                variant="primary" 
                onClick={handleGenerateItinerary} 
                disabled={loadingItinerary}
                className="w-100"
              >
                {loadingItinerary ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Generating Itinerary...
                  </>
                ) : (
                  'Generate AI Itinerary'
                )}
              </Button>
            </div>
          ) : (
            <div>
              {itineraryItems.length > 0 ? (
                <div>
                  <p className="mb-3"><b>Select the activities you'd like to include:</b></p>
                  <Row className="g-3">
                    {itineraryItems.map((item) => (
                      <Col key={item.id} xs={12}>
                        <Card className="h-100" style={{ border: selectedItems.has(item.id) ? '2px solid #0d6efd' : '1px solid #ddd' }}>
                          <Card.Body>
                            <div className="d-flex align-items-start">
                              <Form.Check
                                type="checkbox"
                                checked={selectedItems.has(item.id)}
                                onChange={() => handleToggleItem(item.id)}
                                className="me-3 mt-1"
                              />
                              <div className="flex-grow-1">
                                <Card.Title style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>
                                  {item.title}
                                </Card.Title>
                                {item.activities && item.activities.length > 0 ? (
                                  <ul style={{ fontSize: '0.95rem', color: '#555', lineHeight: '1.8', marginBottom: 0, paddingLeft: '1.25rem' }}>
                                    {item.activities.map((activity, idx) => (
                                      <li key={idx}>{activity}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <Card.Text style={{ fontSize: '0.95rem', color: '#555', lineHeight: '1.6', marginBottom: 0 }}>
                                    {item.description}
                                  </Card.Text>
                                )}
                              </div>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>
              ) : (
                <p>No activities to display</p>
              )}
              <div className="mt-4">
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    setItinerary('');
                    setItineraryItems([]);
                  }}
                  className="w-100 mb-2"
                >
                  Generate Another Itinerary
                </Button>
                <Button 
                  variant="success" 
                  onClick={handleSaveItinerary}
                  disabled={savingItinerary || selectedItems.size === 0}
                  className="w-100"
                >
                  {savingItinerary ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Saving...
                    </>
                  ) : (
                    '💾 Save Itinerary'
                  )}
                </Button>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

CardSwiper.propTypes = {
  destinations: PropTypes.array.isRequired,
  initialIndex: PropTypes.number,
  onIndexChange: PropTypes.func,
  onSwipeRight: PropTypes.func,
  onSwipeLeft: PropTypes.func,
  onReachedEnd: PropTypes.func,
};

CardSwiper.defaultProps = {
  initialIndex: 0,
  onIndexChange: () => {},
  onSwipeRight: () => {},
  onSwipeLeft: () => {},
  onReachedEnd: () => {},
};

export default CardSwiper;
