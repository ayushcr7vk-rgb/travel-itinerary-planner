import React from 'react';
import { Sparkles, MapPin, DollarSign, Calendar, HeartHandshake, Compass } from 'lucide-react';

export default function Hero({ onSelectPreset, onScrollToForm }) {
  const popularDestinations = [
    { name: 'Tokyo, Japan', desc: 'Neon skylines & ancient shrines' },
    { name: 'Paris, France', desc: 'Art, cafes & romantic boulevards' },
    { name: 'Rome, Italy', desc: 'Ancient colosseums & trattorias' },
    { name: 'Swiss Alps', desc: 'Snow peaks & glacial vistas' },
    { name: 'Bali, Indonesia', desc: 'Tropical beaches & tranquil temples' },
    { name: 'New York, USA', desc: 'Broadway lights & world culture' },
    { name: 'Jaipur, India', desc: 'Royal palaces & colorful bazaars' }
  ];

  return (
    <section className="hero-section">
      <div className="hero-backdrop-gradient" />
      <div className="hero-content">
        <div className="hero-pill">
          <Sparkles size={14} className="hero-pill-icon" />
          <span>Generative AI Travel Architect & Concierge</span>
        </div>

        <h1 className="hero-heading">
          Where will your journey take you? <br />
          <span className="gradient-text">Plan every single day with AI precision.</span>
        </h1>

        <p className="hero-subheading">
          Generate bespoke, day-by-day itineraries mapped to your exact budget, schedule,
          travel group, and personal interests. Complete with verified local sights, transport advice, and dining.
        </p>

        {/* Feature Highlights */}
        <div className="hero-features">
          <div className="feature-item">
            <DollarSign size={16} className="feature-icon" />
            <span>Exact Budget Balancing</span>
          </div>
          <div className="feature-item">
            <Calendar size={16} className="feature-icon" />
            <span>Morning, Noon & Night Routes</span>
          </div>
          <div className="feature-item">
            <HeartHandshake size={16} className="feature-icon" />
            <span>Dietary & Accessibility Conscious</span>
          </div>
        </div>

        {/* Popular Presets */}
        <div className="presets-container">
          <span className="presets-label">
            <MapPin size={14} /> Quick Inspiration:
          </span>
          <div className="presets-scroll">
            {popularDestinations.map(dest => (
              <button
                key={dest.name}
                type="button"
                className="preset-chip"
                onClick={() => {
                  onSelectPreset(dest.name);
                  onScrollToForm();
                }}
              >
                <span>{dest.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
