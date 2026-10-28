import React from 'react';
import { 
  Bookmark, Calendar, DollarSign, Users, Trash2, 
  ExternalLink, Sparkles, MapPin, Compass, AlertCircle 
} from 'lucide-react';

export default function SavedTrips({ 
  savedTrips, 
  onLoadTrip, 
  onDeleteTrip, 
  onGoToPlanner 
}) {
  if (!savedTrips || savedTrips.length === 0) {
    return (
      <div className="empty-saved-state">
        <div className="empty-icon-wrap">
          <Bookmark size={40} className="empty-icon" />
        </div>
        <h3 className="empty-title">No Saved Trips Yet</h3>
        <p className="empty-desc">
          Your saved itineraries will be stored here. Create a personalized trip and click "Save Trip" to keep it in your collection.
        </p>
        <button className="btn-primary mt-4" onClick={onGoToPlanner}>
          <Sparkles size={16} />
          <span>Plan Your First Trip</span>
        </button>
      </div>
    );
  }

  return (
    <div className="saved-trips-section">
      <div className="saved-trips-header">
        <div>
          <h2 className="saved-section-title">Saved Travel Itineraries</h2>
          <p className="saved-section-subtitle">
            Manage your past and upcoming travel itineraries.
          </p>
        </div>
        <span className="saved-count-pill">{savedTrips.length} Saved Trip{savedTrips.length > 1 ? 's' : ''}</span>
      </div>

      <div className="saved-grid">
        {savedTrips.map(trip => (
          <div key={trip.id} className="saved-card">
            <div className="saved-card-header">
              <span className="saved-style-badge">
                {trip.travel_style.toUpperCase()}
              </span>
              <button
                className="btn-delete-trip"
                onClick={() => onDeleteTrip(trip.id)}
                title="Delete this saved trip"
                aria-label={`Delete ${trip.title}`}
              >
                <Trash2 size={16} />
              </button>
            </div>

            <h3 className="saved-trip-title">{trip.title}</h3>
            
            <div className="saved-destination">
              <MapPin size={15} className="text-accent" />
              <span>{trip.destination}</span>
            </div>

            <div className="saved-meta-row">
              <div className="saved-meta-item">
                <Calendar size={14} />
                <span>{trip.start_date} → {trip.end_date} ({trip.total_days}d)</span>
              </div>
              <div className="saved-meta-item">
                <Users size={14} />
                <span>{trip.travelers} Traveler{trip.travelers > 1 ? 's' : ''}</span>
              </div>
            </div>

            <div className="saved-financials">
              <div className="financial-col">
                <span className="fin-label">Estimated Cost</span>
                <span className="fin-value">{trip.currency} {trip.total_estimated_cost.toLocaleString()}</span>
              </div>
              <div className="financial-col">
                <span className="fin-label">Allocated Budget</span>
                <span className="fin-value">{trip.currency} {trip.budget.toLocaleString()}</span>
              </div>
            </div>

            {trip.notes && (
              <div className="saved-notes">
                <span>Notes:</span> {trip.notes}
              </div>
            )}

            <div className="saved-card-actions">
              <button
                className="btn-load-trip"
                onClick={() => onLoadTrip(trip)}
              >
                <span>View Full Itinerary</span>
                <ExternalLink size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
