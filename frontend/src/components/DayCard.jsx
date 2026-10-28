import React, { useState } from 'react';
import { 
  Sun, Sunset, Moon, MapPin, Navigation, Clock, DollarSign, 
  Utensils, RefreshCw, Edit3, ChevronDown, ChevronUp, Sparkles 
} from 'lucide-react';

export default function DayCard({ 
  day, 
  currency, 
  onRegenerateDay, 
  isRegenerating, 
  onEditActivity 
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [focusInput, setFocusInput] = useState('');
  const [showRegenPrompt, setShowRegenPrompt] = useState(false);

  const getTimeSlotIcon = (slot) => {
    switch (slot.toLowerCase()) {
      case 'morning':
        return <Sun size={16} className="slot-icon morning" />;
      case 'afternoon':
        return <Sunset size={16} className="slot-icon afternoon" />;
      case 'evening':
        return <Moon size={16} className="slot-icon evening" />;
      default:
        return <Clock size={16} className="slot-icon" />;
    }
  };

  const handleRegenerateClick = () => {
    onRegenerateDay(day.day_number, day.date, focusInput);
    setShowRegenPrompt(false);
    setFocusInput('');
  };

  return (
    <div className="day-card">
      {/* Day Header Banner */}
      <div className="day-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="day-title-block">
          <div className="day-badge">Day {day.day_number}</div>
          <div className="day-meta">
            <h3 className="day-theme">{day.theme}</h3>
            <span className="day-date">{day.date}</span>
          </div>
        </div>

        <div className="day-header-right" onClick={e => e.stopPropagation()}>
          <span className="day-cost-pill">
            <DollarSign size={14} />
            <span>{currency} {day.daily_estimated_cost.toLocaleString()}</span>
          </span>

          <button
            className="btn-regen-day"
            onClick={() => setShowRegenPrompt(!showRegenPrompt)}
            disabled={isRegenerating}
            title="Regenerate activities and dining for this day"
          >
            <RefreshCw size={14} className={isRegenerating ? 'spin-icon' : ''} />
            <span>{isRegenerating ? 'Regenerating...' : 'Regen Day'}</span>
          </button>

          <button
            className="btn-toggle-day"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label="Toggle day details"
          >
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* Optional Quick Focus Prompt for Day Regeneration */}
      {showRegenPrompt && (
        <div className="regen-prompt-banner">
          <Sparkles size={16} className="regen-prompt-icon" />
          <input
            type="text"
            className="form-input regen-input"
            placeholder="Special focus? e.g. 'more outdoor nature', 'budget-friendly dining'"
            value={focusInput}
            onChange={e => setFocusInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleRegenerateClick();
            }}
          />
          <button 
            type="button" 
            className="btn-primary btn-sm"
            onClick={handleRegenerateClick}
            disabled={isRegenerating}
          >
            Apply & Regenerate
          </button>
          <button 
            type="button" 
            className="btn-secondary btn-sm"
            onClick={() => setShowRegenPrompt(false)}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Expandable Day Content */}
      {isExpanded && (
        <div className="day-content">
          {/* Daily Notes if present */}
          {day.daily_notes && (
            <div className="day-notes">
              <span className="notes-label">Pacing & Tips:</span> {day.daily_notes}
            </div>
          )}

          {/* Activities Timeline */}
          <div className="activities-section">
            <h4 className="section-label">Day Schedule & Attractions</h4>
            <div className="activities-timeline">
              {day.activities.map((activity, actIdx) => (
                <div key={actIdx} className="activity-card">
                  <div className="activity-time-header">
                    <span className="time-pill">
                      {getTimeSlotIcon(activity.time_slot)}
                      <span>{activity.time_slot}</span>
                    </span>
                    <span className="activity-category">{activity.category}</span>
                    <button
                      className="btn-edit-entry"
                      onClick={() => onEditActivity(day.day_number, actIdx, activity)}
                      title="Edit this activity"
                    >
                      <Edit3 size={13} />
                      <span>Edit</span>
                    </button>
                  </div>

                  <h5 className="activity-title">{activity.title}</h5>
                  <p className="activity-desc">{activity.description}</p>

                  <div className="activity-footer">
                    <div className="footer-item">
                      <MapPin size={14} className="footer-icon" />
                      <span>{activity.location}</span>
                    </div>

                    <div className="footer-item">
                      <Navigation size={14} className="footer-icon" />
                      <span>{activity.suggested_transportation}</span>
                    </div>

                    <div className="footer-item">
                      <Clock size={14} className="footer-icon" />
                      <span>~{activity.duration_hours} hrs</span>
                    </div>

                    <div className="footer-item cost-item">
                      <DollarSign size={14} className="footer-icon" />
                      <span>{currency} {activity.estimated_cost}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dining Recommendations */}
          <div className="dining-section">
            <div className="dining-header">
              <Utensils size={16} />
              <h4 className="section-label">Culinary Recommendations</h4>
            </div>
            <div className="dining-grid">
              {day.dining.map((meal, mealIdx) => (
                <div key={mealIdx} className="dining-card">
                  <div className="dining-top">
                    <span className="meal-badge">{meal.meal_type}</span>
                    <span className="meal-cost">{currency} {meal.estimated_cost}</span>
                  </div>
                  <h5 className="venue-name">{meal.venue_name}</h5>
                  <span className="cuisine-tag">{meal.cuisine}</span>
                  <p className="dining-desc">{meal.description}</p>
                  {meal.dietary_notes && (
                    <div className="dietary-tag">
                      <span>🥗 {meal.dietary_notes}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
