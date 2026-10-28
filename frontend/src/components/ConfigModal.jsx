import React, { useRef, useEffect } from 'react';
import { X, Sparkles, Database, CheckCircle2, AlertCircle, Copy, ExternalLink, Code } from 'lucide-react';

export default function ConfigModal({ isOpen, onClose, health }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isAiConfigured = health?.ai?.configured;
  const isSupabaseConfigured = health?.storage?.supabase_configured;

  return (
    <dialog
      ref={dialogRef}
      className="native-dialog config-dialog"
      aria-labelledby="config-title"
      onCancel={onClose}
    >
      <div className="dialog-header">
        <div>
          <span className="dialog-tag">System Architecture & Credentials</span>
          <h3 id="config-title" className="dialog-title">Live AI & Database Setup Guide</h3>
        </div>
        <button 
          type="button" 
          className="btn-close-dialog" 
          onClick={onClose} 
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>
      </div>

      <div className="config-dialog-content">
        {/* Status Summary Banner */}
        <div className="config-status-grid">
          <div className={`config-status-card ${isAiConfigured ? 'status-ok' : 'status-pending'}`}>
            <div className="status-card-header">
              <Sparkles size={16} />
              <h4>Generative AI Engine</h4>
            </div>
            <div className="status-card-value">
              {isAiConfigured ? (
                <span className="tag-live"><CheckCircle2 size={14} /> Live ({health?.ai?.model})</span>
              ) : (
                <span className="tag-demo"><AlertCircle size={14} /> Demo Mode Active</span>
              )}
            </div>
            <p className="status-card-desc">
              {health?.ai?.info}
            </p>
          </div>

          <div className={`config-status-card ${isSupabaseConfigured ? 'status-ok' : 'status-pending'}`}>
            <div className="status-card-header">
              <Database size={16} />
              <h4>Persistence Engine</h4>
            </div>
            <div className="status-card-value">
              {isSupabaseConfigured ? (
                <span className="tag-live"><CheckCircle2 size={14} /> Supabase PostgreSQL (RLS Enabled)</span>
              ) : (
                <span className="tag-demo"><AlertCircle size={14} /> Local Store ({health?.storage?.total_local_trips} Trips)</span>
              )}
            </div>
            <p className="status-card-desc">
              {isSupabaseConfigured 
                ? 'Cloud persistence active with Row Level Security.' 
                : 'Saving trips locally to backend/data/local_trips.json.'}
            </p>
          </div>
        </div>

        {/* Gemini Instructions */}
        <div className="setup-step-box">
          <div className="step-title-row">
            <span className="step-number">1</span>
            <h4>Enable Google Gemini Generative AI (Free Tier)</h4>
          </div>
          <p className="step-desc">
            To switch from pre-curated destination intelligence to live Gemini LLM generation:
          </p>
          <ol className="step-instructions">
            <li>
              Obtain a free Gemini API key at{' '}
              <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="link-ext">
                Google AI Studio <ExternalLink size={12} />
              </a>
            </li>
            <li>
              Open your local file <code>travel-itinerary-planner/backend/.env</code>
            </li>
            <li>
              Add your key:
              <pre className="code-block">GEMINI_API_KEY=your_actual_gemini_api_key_here</pre>
            </li>
            <li>Restart the backend server. The app automatically detects the key.</li>
          </ol>
        </div>

        {/* Supabase Instructions */}
        <div className="setup-step-box">
          <div className="step-title-row">
            <span className="step-number">2</span>
            <h4>Enable Supabase Cloud Database (PostgreSQL + RLS)</h4>
          </div>
          <p className="step-desc">
            To switch from local JSON storage to Supabase Cloud Database:
          </p>
          <ol className="step-instructions">
            <li>
              Create a free project at{' '}
              <a href="https://supabase.com/" target="_blank" rel="noreferrer" className="link-ext">
                Supabase <ExternalLink size={12} />
              </a>
            </li>
            <li>
              Go to the <strong>SQL Editor</strong> in Supabase, paste the contents of{' '}
              <code>travel-itinerary-planner/supabase/schema.sql</code>, and click <strong>Run</strong>.
            </li>
            <li>
              In Supabase Project Settings → <strong>API</strong>, copy your <strong>Project URL</strong> and <strong>service_role or anon key</strong>.
            </li>
            <li>
              In <code>travel-itinerary-planner/backend/.env</code>, set:
              <pre className="code-block">
                SUPABASE_URL=https://your-project.supabase.co{'\n'}
                SUPABASE_KEY=your_supabase_api_key
              </pre>
            </li>
            <li>Restart backend server. Saved trips will immediately sync to Supabase!</li>
          </ol>
        </div>
      </div>

      <div className="dialog-footer">
        <button type="button" className="btn-primary" onClick={onClose}>
          Got It
        </button>
      </div>
    </dialog>
  );
}
