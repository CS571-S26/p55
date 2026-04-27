import React from 'react';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';

const ItineraryDisplay = ({ itinerary }) => {
  if (!itinerary) {
    return <p>No itinerary to display</p>;
  }

  // Handle both full itinerary structures and activity-only structures
  const hasFullStructure = itinerary.days && Array.isArray(itinerary.days);

  if (!hasFullStructure) {
    // Fallback for older activity-only format
    return (
      <div>
        <h4 className="mb-4">{itinerary.city}, {itinerary.country}</h4>
        <p className="mb-3"><strong>Saved:</strong> {new Date(itinerary.savedAt).toLocaleDateString()}</p>
        <h6 className="fw-bold mb-3">Activities</h6>
        {itinerary.activities?.map((activity, idx) => (
          <div key={idx} className="activity-item mb-3 p-3 bg-light rounded">
            <div className="d-flex justify-content-between">
              <h6 className="mb-1">{activity.title}</h6>
              {activity.time && <span className="text-muted small">{activity.time}</span>}
            </div>
            {activity.description && <p className="text-muted mb-1">{activity.description}</p>}
            {activity.duration && <small className="text-secondary">⏱️ {activity.duration}</small>}
          </div>
        ))}
      </div>
    );
  }

  // Full itinerary display (matching Itinerary.jsx layout)
  return (
    <div>
      <div className="mb-5">
        <h2 className="mb-2">{itinerary.title}</h2>
        <p className="text-muted mb-3">{itinerary.overview}</p>
        <div className="mb-3">
          <Badge bg="info" className="me-2 px-3 py-2">{itinerary.duration} Days</Badge>
          <Badge bg="success" className="me-2 px-3 py-2">{itinerary.budget_estimate}</Badge>
        </div>
      </div>

      {itinerary.transport && (
        <div className="transport-section mb-5 p-3 bg-light rounded">
          <h5 className="mb-3">🚗 Transportation</h5>
          <p>{itinerary.transport}</p>
        </div>
      )}

      {itinerary.days && itinerary.days.length > 0 && (
        <div className="days-section mb-5">
          <h4 className="mb-4">📅 Daily Itinerary</h4>
          {itinerary.days.map((day) => (
            <Card key={day.day} className="mb-3 border-start border-primary border-5">
              <Card.Header className="bg-light">
                <h5 className="mb-0">Day {day.day}: {day.theme}</h5>
              </Card.Header>
              <Card.Body>
                <div className="activities mb-4">
                  <h6 className="fw-bold mb-3">Activities</h6>
                  {day.activities?.map((activity, idx) => (
                    <div key={idx} className="activity-item mb-3 p-3 bg-light rounded">
                      <div className="d-flex justify-content-between">
                        <h6 className="mb-1">{activity.activity}</h6>
                        <Badge bg="secondary">{activity.time}</Badge>
                      </div>
                      <p className="text-muted mb-1">{activity.description}</p>
                      <small className="text-secondary">⏱️ {activity.duration}</small>
                    </div>
                  ))}
                </div>

                {day.meals && (
                  <div className="meals mb-4">
                    <h6 className="fw-bold mb-2">🍽️ Meals</h6>
                    {day.meals.map((meal, idx) => (
                      <p key={idx} className="mb-1">{meal}</p>
                    ))}
                  </div>
                )}

                {day.tips && (
                  <div className="tips p-3 bg-warning bg-opacity-10 rounded">
                    <h6 className="fw-bold mb-2">💡 Tips</h6>
                    <p className="mb-0">{day.tips}</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      {itinerary.packing_tips && itinerary.packing_tips.length > 0 && (
        <div className="packing-section p-4 bg-light rounded">
          <h5 className="mb-3">🎒 Packing Tips</h5>
          <div className="row">
            {itinerary.packing_tips.map((tip, idx) => (
              <div key={idx} className="col-md-6 mb-2">
                <span className="badge bg-info me-2">✓</span>
                {tip}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ItineraryDisplay;
