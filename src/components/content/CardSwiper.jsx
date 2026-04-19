import React, { useState, useEffect } from 'react';
import { Card, Button } from 'react-bootstrap';
import PropTypes from 'prop-types';
import ImageCarousel from './ImageCarousel';

// Simple swipeable card stack for travel destinations
const CardSwiper = ({ destinations, initialIndex = 0, onIndexChange, onSwipeRight, onSwipeLeft, onReachedEnd }) => {
  const [current, setCurrent] = useState(initialIndex);

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
      onSwipeRight(destinations[current]);
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

  return (
    <div className="d-flex flex-column align-items-center">
      <Card style={{ width: '22rem', minHeight: '32rem' }} className="mb-3 shadow">
        <ImageCarousel images={dest.images} />
        <Card.Body>
          <Card.Title>{dest.city}, {dest.country}</Card.Title>
          {dest.region && <p style={{ fontSize: '0.85rem', color: '#666' }}>{dest.region.charAt(0).toUpperCase() + dest.region.slice(1).replace('_', ' ')}</p>}
          <Card.Text>{dest.description}</Card.Text>
          <ul className="text-start" style={{ fontSize: '0.95rem', lineHeight: '1.8' }}>
            {dest.budget && <li><b>Budget Level:</b> {dest.budget}</li>}
            {dest.bestFor && <li><b>Best For:</b> {dest.bestFor}</li>}
            {dest.idealDuration && <li><b>Ideal Duration:</b> {dest.idealDuration}</li>}
            {dest.attractions && <li><b>Top Attractions:</b> {dest.attractions}</li>}
          </ul>
        </Card.Body>
      </Card>
      <div>
        <Button variant="danger" className="me-3" onClick={() => handleSwipe('left')}>❌ Discard</Button>
        <Button variant="success" onClick={() => handleSwipe('right')}>❤️ Save</Button>
      </div>
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
