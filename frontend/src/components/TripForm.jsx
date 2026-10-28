import React, { useState, useEffect } from 'react';
import { 
  MapPin, Calendar, DollarSign, Users, Sparkles, Compass, 
  Utensils, Accessibility, AlertCircle, ArrowRight, Check 
} from 'lucide-react';

const INTEREST_OPTIONS = [
  { id: 'adventure', label: 'Adventure & Thrills', icon: '🧗' },
  { id: 'nature', label: 'Nature & Scenery', icon: '🌿' },
  { id: 'food', label: 'Food & Culinary', icon: '🍜' },
  { id: 'history', label: 'History & Heritage', icon: '🏛️' },
  { id: 'culture', label: 'Culture & Arts', icon: '🎨' },
  { id: 'shopping', label: 'Shopping & Bazaars', icon: '🛍️' },
  { id: 'relaxation', label: 'Relaxation & Wellness', icon: '🧖' }
];

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' }
];

const TRAVEL_STYLES = [
  { id: 'budget', label: 'Budget', icon: '🎒', desc: 'Hostels, public transit, street eats' },
  { id: 'balanced', label: 'Balanced', icon: '⚖️', desc: 'Boutique hotels, mix of transit & dining' },
  { id: 'luxury', label: 'Luxury', icon: '💎', desc: 'Fine dining, private tours, luxury stays' }
];

const DIETARY_OPTIONS = [
  'None',
  'Vegetarian',
  'Vegan',
  'Halal',
  'Gluten-Free',
  'Kosher',
  'Dairy-Free'
];

const ACCESSIBILITY_OPTIONS = [
  'None',
  'Wheelchair Accessible',
  'Minimal Walking / Low Fatigue',
  'Senior / Elderly Friendly',
  'Elevator & Ramp Priority'
];

const LOADING_PHRASES = [
  'Consulting destination geography & transit grids...',
  'Curating morning, afternoon & evening highlights...',
  'Balancing authentic local dining with your budget...',
  'Verifying route sequencing to avoid backtrack fatigue...',
  'Finalizing your personalized day-by-day itinerary...'
];

function getDefaultDates() {
  const now = new Date();
  now.setDate(now.getDate() + 7);
  const s = now.toISOString().split('T')[0];
  const later = new Date(now);
  later.setDate(later.getDate() + 3);
  const e = later.toISOString().split('T')[0];
  return { start: s, end: e };
}

export default function TripForm({ initialValues, onSubmit, isLoading }) {
  const [destination, setDestination] = useState(initialValues?.destination || 'Tokyo, Japan');
  const [startDate, setStartDate] = useState(() => initialValues?.startDate || getDefaultDates().start);
  const [endDate, setEndDate] = useState(() => initialValues?.endDate || getDefaultDates().end);
  const [budget, setBudget] = useState(initialValues?.budget || 1800);
  const [currency, setCurrency] = useState(initialValues?.currency || 'USD');
  const [travelers, setTravelers] = useState(initialValues?.travelers || 2);
  const [travelStyle, setTravelStyle] = useState(initialValues?.travelStyle || 'balanced');
  const [interests, setInterests] = useState(initialValues?.interests || ['culture', 'food', 'history']);
  const [dietary, setDietary] = useState(initialValues?.dietary || 'None');
  const [customDietary, setCustomDietary] = useState('');
  const [accessibility, setAccessibility] = useState(initialValues?.accessibility || 'None');
  const [customAccessibility, setCustomAccessibility] = useState('');
  
  const [errors, setErrors] = useState({});
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);

  // Sync external preset destination changes
  useEffect(() => {
    if (initialValues?.destination) {
      setDestination(initialValues.destination);
    }
  }, [initialValues?.destination]);

  // Loading text rotation
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setLoadingTextIndex(prev => (prev + 1) % LOADING_PHRASES.length);
    }, 2400);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Calculate duration
  const getDurationDays = () => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diff = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };

  const durationDays = getDurationDays();

  const toggleInterest = (id) => {
    setInterests(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const validate = () => {
    const errs = {};
    if (!destination.trim() || destination.trim().length < 2) {
      errs.destination = 'Please enter a valid destination city or region.';
    }
    if (!startDate) {
      errs.startDate = 'Please select a start date.';
    }
    if (!endDate) {
      errs.endDate = 'Please select an end date.';
    }
    if (startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      if (e < s) {
        errs.endDate = 'End date cannot be earlier than start date.';
      } else if (durationDays > 14) {
        errs.endDate = 'Trip itineraries are supported for up to 14 days.';
      }
    }
    if (!budget || Number(budget) <= 0) {
      errs.budget = 'Please enter a valid budget greater than 0.';
    }
    if (interests.length === 0) {
      errs.interests = 'Please select at least one interest to personalize activities.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const dietaryPref = dietary === 'Custom' ? customDietary : (dietary === 'None' ? '' : dietary);
    const accessPref = accessibility === 'Custom' ? customAccessibility : (accessibility === 'None' ? '' : accessibility);

    onSubmit({
      destination: destination.trim(),
      start_date: startDate,
      end_date: endDate,
      budget: Number(budget),
      currency,
      travelers: Number(travelers),
      travel_style: travelStyle,
      interests,
      dietary_preferences: dietaryPref,
      accessibility_requirements: accessPref
    });
  };

  return (
    <div id="planner-form" className="form-card">
      <div className="form-header">
        <div className="form-header-badge">
          <Compass size={16} />
          <span>Interactive Itinerary Generator</span>
        </div>
        <h2 className="form-title">Customize Your Travel Experience</h2>
        <p className="form-description">
          Tell us where you want to go and your budget constraints. Our AI engine builds a day-by-day plan with activities, dining, and transit suggestions.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* Destination & Duration Row */}
        <div className="form-grid-2">
          {/* Destination */}
          <div className="form-group">
            <label htmlFor="destination" className="form-label">
              <MapPin size={16} className="label-icon text-accent" />
              <span>Destination</span>
            </label>
            <div className="input-icon-wrapper">
              <input
                id="destination"
                type="text"
                className={`form-input ${errors.destination ? 'input-error' : ''}`}
                placeholder="e.g. Tokyo, Paris, New York, Bali"
                value={destination}
                onChange={e => {
                  setDestination(e.target.value);
                  if (errors.destination) setErrors(prev => ({ ...prev, destination: null }));
                }}
                disabled={isLoading}
                required
              />
            </div>
            {errors.destination && (
              <span className="field-error"><AlertCircle size={12} /> {errors.destination}</span>
            )}
          </div>

          {/* Dates & Duration */}
          <div className="form-group">
            <label className="form-label">
              <Calendar size={16} className="label-icon text-accent" />
              <span>Travel Dates {durationDays > 0 && <span className="duration-pill">{durationDays} Day{durationDays > 1 ? 's' : ''}</span>}</span>
            </label>
            <div className="dates-row">
              <div className="date-field">
                <input
                  type="date"
                  className={`form-input ${errors.startDate ? 'input-error' : ''}`}
                  value={startDate}
                  onChange={e => {
                    setStartDate(e.target.value);
                    if (errors.startDate) setErrors(prev => ({ ...prev, startDate: null }));
                  }}
                  disabled={isLoading}
                  required
                />
              </div>
              <span className="date-separator">to</span>
              <div className="date-field">
                <input
                  type="date"
                  className={`form-input ${errors.endDate ? 'input-error' : ''}`}
                  value={endDate}
                  onChange={e => {
                    setEndDate(e.target.value);
                    if (errors.endDate) setErrors(prev => ({ ...prev, endDate: null }));
                  }}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>
            {errors.endDate && (
              <span className="field-error"><AlertCircle size={12} /> {errors.endDate}</span>
            )}
          </div>
        </div>

        {/* Budget & Travelers Row */}
        <div className="form-grid-3">
          {/* Total Budget */}
          <div className="form-group">
            <label htmlFor="budget" className="form-label">
              <DollarSign size={16} className="label-icon text-accent" />
              <span>Total Budget</span>
            </label>
            <div className="budget-input-wrapper">
              <input
                id="budget"
                type="number"
                min="50"
                step="10"
                className={`form-input ${errors.budget ? 'input-error' : ''}`}
                value={budget}
                onChange={e => {
                  setBudget(e.target.value);
                  if (errors.budget) setErrors(prev => ({ ...prev, budget: null }));
                }}
                disabled={isLoading}
                required
              />
            </div>
            {errors.budget && (
              <span className="field-error"><AlertCircle size={12} /> {errors.budget}</span>
            )}
          </div>

          {/* Currency */}
          <div className="form-group">
            <label htmlFor="currency" className="form-label">
              <span>Currency</span>
            </label>
            <select
              id="currency"
              className="form-select"
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              disabled={isLoading}
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol}) - {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Travelers Counter */}
          <div className="form-group">
            <label className="form-label">
              <Users size={16} className="label-icon text-accent" />
              <span>Travelers</span>
            </label>
            <div className="counter-control">
              <button
                type="button"
                className="counter-btn"
                onClick={() => setTravelers(prev => Math.max(1, prev - 1))}
                disabled={travelers <= 1 || isLoading}
              >
                -
              </button>
              <span className="counter-value">{travelers} {travelers === 1 ? 'Person' : 'People'}</span>
              <button
                type="button"
                className="counter-btn"
                onClick={() => setTravelers(prev => Math.min(20, prev + 1))}
                disabled={travelers >= 20 || isLoading}
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Travel Style Selector */}
        <div className="form-group mt-4">
          <label className="form-label">
            <span>Travel Style & Pacing</span>
          </label>
          <div className="travel-style-grid">
            {TRAVEL_STYLES.map(style => (
              <div
                key={style.id}
                className={`style-card ${travelStyle === style.id ? 'active' : ''}`}
                onClick={() => !isLoading && setTravelStyle(style.id)}
                role="button"
                tabIndex={0}
              >
                <div className="style-icon">{style.icon}</div>
                <div className="style-info">
                  <div className="style-title">{style.label}</div>
                  <div className="style-desc">{style.desc}</div>
                </div>
                {travelStyle === style.id && <Check className="style-check" size={16} />}
              </div>
            ))}
          </div>
        </div>

        {/* Interests Multi-Select */}
        <div className="form-group mt-4">
          <div className="interests-header">
            <label className="form-label">
              <Sparkles size={16} className="label-icon text-accent" />
              <span>Interests & Experiences (Select all that apply)</span>
            </label>
            <span className="interests-selected-count">{interests.length} selected</span>
          </div>
          <div className="interests-grid">
            {INTEREST_OPTIONS.map(interest => {
              const selected = interests.includes(interest.id);
              return (
                <button
                  key={interest.id}
                  type="button"
                  className={`interest-pill ${selected ? 'active' : ''}`}
                  onClick={() => toggleInterest(interest.id)}
                  disabled={isLoading}
                >
                  <span className="interest-icon">{interest.icon}</span>
                  <span className="interest-text">{interest.label}</span>
                  {selected && <Check size={14} className="interest-check" />}
                </button>
              );
            })}
          </div>
          {errors.interests && (
            <span className="field-error"><AlertCircle size={12} /> {errors.interests}</span>
          )}
        </div>

        {/* Optional Preferences Accordion / Row */}
        <div className="form-grid-2 mt-4">
          {/* Dietary Preferences */}
          <div className="form-group">
            <label htmlFor="dietary" className="form-label">
              <Utensils size={16} className="label-icon text-accent" />
              <span>Dietary Preferences (Optional)</span>
            </label>
            <select
              id="dietary"
              className="form-select"
              value={dietary}
              onChange={e => setDietary(e.target.value)}
              disabled={isLoading}
            >
              {DIETARY_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
              <option value="Custom">Custom Dietary Note...</option>
            </select>
            {dietary === 'Custom' && (
              <input
                type="text"
                className="form-input mt-2"
                placeholder="e.g. Nut allergy, pescatarian"
                value={customDietary}
                onChange={e => setCustomDietary(e.target.value)}
                disabled={isLoading}
              />
            )}
          </div>

          {/* Accessibility Requirements */}
          <div className="form-group">
            <label htmlFor="accessibility" className="form-label">
              <Accessibility size={16} className="label-icon text-accent" />
              <span>Accessibility Requirements (Optional)</span>
            </label>
            <select
              id="accessibility"
              className="form-select"
              value={accessibility}
              onChange={e => setAccessibility(e.target.value)}
              disabled={isLoading}
            >
              {ACCESSIBILITY_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
              <option value="Custom">Custom Accessibility Note...</option>
            </select>
            {accessibility === 'Custom' && (
              <input
                type="text"
                className="form-input mt-2"
                placeholder="e.g. Ground floor only, no steep stairs"
                value={customAccessibility}
                onChange={e => setCustomAccessibility(e.target.value)}
                disabled={isLoading}
              />
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="form-actions mt-6">
          <button
            type="submit"
            className={`btn-primary btn-generate ${isLoading ? 'btn-loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="loading-content">
                <span className="spinner" />
                <span className="loading-phrase">{LOADING_PHRASES[loadingTextIndex]}</span>
              </div>
            ) : (
              <div className="btn-content">
                <Sparkles size={18} />
                <span>Generate Personalized Itinerary</span>
                <ArrowRight size={18} />
              </div>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
