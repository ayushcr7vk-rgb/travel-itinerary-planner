import React from 'react';
import { 
  Bookmark, RefreshCw, Printer, Share2, DollarSign, 
  Calendar, Users, Compass, Check, Info, Lightbulb 
} from 'lucide-react';

export default function TripSummary({ 
  itinerary, 
  isSaved, 
  onSaveTrip, 
  isSaving, 
  onRegenerateAll, 
  isRegenerating,
  onShare 
}) {
  if (!itinerary || !itinerary.trip_summary) return null;

  const { trip_summary, overview, practical_tips, is_demo, disclaimer } = itinerary;
  const { 
    destination, 
    total_days, 
    travelers, 
    travel_style, 
    budget, 
    currency, 
    total_estimated_cost, 
    remaining_budget, 
    budget_status 
  } = trip_summary;

  const budgetUsedPercent = Math.min(100, Math.round((total_estimated_cost / (budget || 1)) * 100));

  const getStatusColor = () => {
    if (budget_status === 'Under budget') return 'status-success';
    if (budget_status === 'Within budget') return 'status-info';
    return 'status-warning';
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="trip-summary-wrapper">
      {/* Demo Mode Notice Banner if applicable */}
      {is_demo && (
        <div className="demo-alert-banner">
          <Info size={18} className="demo-alert-icon" />
          <div className="demo-alert-text">
            <strong>Demo Mode Active:</strong> {disclaimer}
          </div>
        </div>
      )}

      {/* Main Summary Header Card */}
      <div className="summary-card">
        <div className="summary-top-row">
          <div className="summary-destination-info">
            <span className="summary-badge">
              <Compass size={14} /> {travel_style.toUpperCase()} EXPEDITION
            </span>
            <h1 className="summary-title">{destination}</h1>
            <p className="summary-overview">{overview}</p>
          </div>

          {/* Action Buttons */}
          <div className="summary-actions">
            <button
              className={`btn-action btn-save ${isSaved ? 'btn-saved' : ''}`}
              onClick={onSaveTrip}
              disabled={isSaving}
            >
              {isSaved ? <Check size={16} /> : <Bookmark size={16} />}
              <span>{isSaved ? 'Saved to Library' : isSaving ? 'Saving...' : 'Save Trip'}</span>
            </button>

            <button
              className="btn-action btn-secondary"
              onClick={onRegenerateAll}
              disabled={isRegenerating}
              title="Regenerate the entire itinerary with new variations"
            >
              <RefreshCw size={16} className={isRegenerating ? 'spin-icon' : ''} />
              <span>{isRegenerating ? 'Regenerating...' : 'Regenerate All'}</span>
            </button>

            <button
              className="btn-action btn-secondary"
              onClick={handlePrint}
              title="Print or export as PDF"
            >
              <Printer size={16} />
              <span>Print / PDF</span>
            </button>

            <button
              className="btn-action btn-secondary"
              onClick={onShare}
              title="Copy shareable summary to clipboard"
            >
              <Share2 size={16} />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Quick Meta Pills */}
        <div className="summary-meta-grid">
          <div className="meta-card">
            <div className="meta-icon"><Calendar size={18} /></div>
            <div className="meta-content">
              <span className="meta-label">Duration</span>
              <span className="meta-value">{total_days} Days</span>
            </div>
          </div>

          <div className="meta-card">
            <div className="meta-icon"><Users size={18} /></div>
            <div className="meta-content">
              <span className="meta-label">Travelers</span>
              <span className="meta-value">{travelers} {travelers === 1 ? 'Solo' : 'Travelers'}</span>
            </div>
          </div>

          <div className="meta-card">
            <div className="meta-icon"><DollarSign size={18} /></div>
            <div className="meta-content">
              <span className="meta-label">Allocated Budget</span>
              <span className="meta-value">{currency} {budget.toLocaleString()}</span>
            </div>
          </div>

          <div className="meta-card">
            <div className="meta-icon"><Compass size={18} /></div>
            <div className="meta-content">
              <span className="meta-label">Estimated Total</span>
              <span className="meta-value">{currency} {total_estimated_cost.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Budget Meter Bar */}
        <div className="budget-meter-container">
          <div className="budget-meter-header">
            <span className="meter-label">
              Budget Utilization: <strong>{budgetUsedPercent}%</strong>
            </span>
            <span className={`meter-status-pill ${getStatusColor()}`}>
              {budget_status} ({remaining_budget >= 0 ? `+${currency} ${remaining_budget.toLocaleString()} left` : `-${currency} ${Math.abs(remaining_budget).toLocaleString()} over`})
            </span>
          </div>
          <div className="meter-track">
            <div 
              className={`meter-fill ${getStatusColor()}`} 
              style={{ width: `${Math.min(100, budgetUsedPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Practical Travel Tips Card */}
      {practical_tips && practical_tips.length > 0 && (
        <div className="tips-card">
          <div className="tips-header">
            <Lightbulb size={18} className="tips-icon" />
            <h3>Local Destination Advice & Practical Tips</h3>
          </div>
          <ul className="tips-list">
            {practical_tips.map((tip, idx) => (
              <li key={idx} className="tip-item">
                <span className="tip-bullet">•</span>
                <span className="tip-text">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
