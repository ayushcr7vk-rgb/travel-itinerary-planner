import React from 'react';
import { Compass, Bookmark, Sparkles, Database, Settings, ShieldCheck, AlertCircle } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, savedCount, health, onOpenConfig }) {
  const isAiLive = health?.ai?.configured;
  const isSupabaseLive = health?.storage?.supabase_configured;

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Brand */}
        <div className="brand" onClick={() => setActiveTab('planner')} role="button" tabIndex={0}>
          <div className="brand-icon">
            <Compass className="icon-pulse" size={26} />
          </div>
          <div className="brand-text">
            <span className="brand-title">WanderPlan<span className="brand-ai">AI</span></span>
            <span className="brand-subtitle">Smart Travel Itineraries</span>
          </div>
        </div>

        {/* Center Navigation */}
        <nav className="nav-links">
          <button
            className={`nav-link ${activeTab === 'planner' ? 'active' : ''}`}
            onClick={() => setActiveTab('planner')}
          >
            <Sparkles size={16} />
            <span>Plan Itinerary</span>
          </button>
          <button
            className={`nav-link ${activeTab === 'saved' ? 'active' : ''}`}
            onClick={() => setActiveTab('saved')}
          >
            <Bookmark size={16} />
            <span>Saved Trips</span>
            {savedCount > 0 && <span className="badge-count">{savedCount}</span>}
          </button>
        </nav>

        {/* System Badges & Config */}
        <div className="navbar-actions">
          {/* AI Mode Badge */}
          <button
            className={`status-chip ${isAiLive ? 'chip-live' : 'chip-demo'}`}
            onClick={onOpenConfig}
            title={health?.ai?.info || 'Click to view API & Database setup guide'}
          >
            {isAiLive ? <ShieldCheck size={14} /> : <AlertCircle size={14} />}
            <span className="chip-label">
              {isAiLive ? 'Gemini 3.8 Flash' : 'Demo Mode'}
            </span>
          </button>

          {/* Database Mode Badge */}
          <button
            className={`status-chip ${isSupabaseLive ? 'chip-live' : 'chip-local'}`}
            onClick={onOpenConfig}
            title={`Storage: ${isSupabaseLive ? 'Supabase Cloud Database' : 'Local Storage'}`}
          >
            <Database size={14} />
            <span className="chip-label">
              {isSupabaseLive ? 'Supabase' : 'Local DB'}
            </span>
          </button>

          {/* Config Guide Button */}
          <button
            className="btn-icon"
            onClick={onOpenConfig}
            aria-label="Configuration and viva guide"
            title="Setup & System Information"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
