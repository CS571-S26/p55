import React, { useState, useEffect } from 'react';
import Carousel from 'react-bootstrap/Carousel';
import PropTypes from 'prop-types';
import '../../css/ImageCarousel.css';

const ImageCarousel = ({ images, fallbackImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="200"%3E%3Crect width="600" height="200" fill="%23e0e0e0"/%3E%3Ctext x="50%25" y="50%25" font-size="20" fill="%23999" text-anchor="middle" dominant-baseline="middle"%3ENo Image Available%3C/text%3E%3C/svg%3E' }) => {
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
