import React, { useState, useEffect } from 'react';
import Carousel from 'react-bootstrap/Carousel';
import PropTypes from 'prop-types';
import '../../css/ImageCarousel.css';

const ImageCarousel = ({ images, fallbackImage = 'https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?auto=format&fit=crop&w=600&q=80' }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  // Reset to first image when images change
  useEffect(() => {
    setActiveIndex(0);
  }, [images]);

  if (!images || images.length === 0) {
    return (
      <img 
        src={fallbackImage} 
        alt="Destination" 
        style={{ width: '100%', height: '200px', objectFit: 'cover' }} 
      />
    );
  }

  return (
    <Carousel 
      interval={null} 
      style={{ height: '200px' }} 
      className="custom-carousel"
      activeIndex={activeIndex}
      onSelect={(selectedIndex) => setActiveIndex(selectedIndex)}
    >
      {images.map((image, index) => (
        <Carousel.Item key={index}>
          <img
            className="d-block w-100"
            src={image}
            alt={`Slide ${index + 1}`}
            style={{ height: '200px', objectFit: 'cover', width: '100%' }}
            onError={(e) => {
              e.target.src = fallbackImage;
            }}
          />
        </Carousel.Item>
      ))}
    </Carousel>
  );
};

ImageCarousel.propTypes = {
  images: PropTypes.arrayOf(PropTypes.string),
  fallbackImage: PropTypes.string
};

export default ImageCarousel;
