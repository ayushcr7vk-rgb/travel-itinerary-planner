import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import TripForm from './components/TripForm';
import TripSummary from './components/TripSummary';
import DayCard from './components/DayCard';
import EditActivityModal from './components/EditActivityModal';
import SavedTrips from './components/SavedTrips';
import ConfigModal from './components/ConfigModal';
import Toast from './components/Toast';

import { 
  fetchHealth, 
  generateItinerary, 
  regenerateDay, 
  regenerateItinerary, 
  getSavedTrips, 
  saveTrip, 
  deleteTrip 
} from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('planner'); // 'planner' | 'saved'
  const [health, setHealth] = useState(null);
  const [savedTrips, setSavedTrips] = useState([]);
  
  // Itinerary generation state
  const [currentPreferences, setCurrentPreferences] = useState(null);
  const [itinerary, setItinerary] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegeneratingAll, setIsRegeneratingAll] = useState(false);
  const [regeneratingDayNumber, setRegeneratingDayNumber] = useState(null);
  
  // Saved state for current itinerary
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Modals & Notifications
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [editingActivityData, setEditingActivityData] = useState(null);
  const [toast, setToast] = useState(null);

  // Load health and saved trips
  const loadHealth = async () => {
    try {
      const data = await fetchHealth();
      setHealth(data);
    } catch (err) {
      console.warn('Backend health check warning:', err.message);
    }
  };

  const loadSavedTrips = async () => {
    try {
      const trips = await getSavedTrips();
      setSavedTrips(trips);
    } catch (err) {
      console.warn('Could not load saved trips:', err.message);
    }
  };

  useEffect(() => {
    loadHealth();
    loadSavedTrips();
  }, []);

  // Preset click from Hero
  const handleSelectPreset = (destName) => {
    setCurrentPreferences(prev => ({
      ...(prev || {}),
      destination: destName
    }));
  };

  const scrollToSection = (id) => {
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // Generate Itinerary
  const handleGenerate = async (preferences) => {
    setIsGenerating(true);
    setCurrentPreferences(preferences);
    setIsSaved(false);

    try {
      const result = await generateItinerary(preferences);
      setItinerary(result);
      showToast(`Itinerary for ${preferences.destination} generated successfully!`, 'success');
      
      // Joyful celebratory burst
      try {
        confetti({
          particleCount: 65,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore if confetti unavailable
      }

      scrollToSection('results-view');
    } catch (err) {
      console.error('Error generating itinerary:', err);
      showToast(err.message || 'Failed to generate itinerary. Please try again.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Regenerate entire itinerary
  const handleRegenerateAll = async () => {
    if (!currentPreferences) return;
    setIsRegeneratingAll(true);
    try {
      const result = await regenerateItinerary(currentPreferences);
      setItinerary(result);
      setIsSaved(false);
      showToast('Itinerary regenerated with new variations!', 'success');
    } catch (err) {
      console.error('Error regenerating itinerary:', err);
      showToast(err.message || 'Failed to regenerate itinerary.', 'error');
    } finally {
      setIsRegeneratingAll(false);
    }
  };

  // Regenerate an individual day
  const handleRegenerateDay = async (dayNumber, date, focusNote) => {
    if (!currentPreferences) return;
    setRegeneratingDayNumber(dayNumber);

    try {
      const newDay = await regenerateDay(currentPreferences, dayNumber, date, focusNote);
      
      // Update the day in current itinerary and recalculate budget
      setItinerary(prev => {
        if (!prev) return prev;
        const updatedDays = prev.days.map(d => d.day_number === dayNumber ? newDay : d);
        const newTotalCost = updatedDays.reduce((acc, d) => acc + d.daily_estimated_cost, 0);
        const newRem = currentPreferences.budget - newTotalCost;
        let newStatus = 'Within budget';
        if (newRem >= 0.15 * currentPreferences.budget) newStatus = 'Under budget';
        else if (newRem < 0) newStatus = 'Budget stretched';

        return {
          ...prev,
          days: updatedDays,
          trip_summary: {
            ...prev.trip_summary,
            total_estimated_cost: Math.round(newTotalCost * 10) / 10,
            remaining_budget: Math.round(newRem * 10) / 10,
            budget_status: newStatus
          }
        };
      });

      setIsSaved(false);
      showToast(`Day ${dayNumber} updated with fresh recommendations!`, 'success');
    } catch (err) {
      console.error('Error regenerating day:', err);
      showToast(err.message || 'Failed to regenerate day.', 'error');
    } finally {
      setRegeneratingDayNumber(null);
    }
  };

  // Save current trip
  const handleSaveTrip = async () => {
    if (!itinerary || !currentPreferences) return;
    setIsSaving(true);
    try {
      const title = `${currentPreferences.destination} Expedition (${currentPreferences.travelers} Traveler${currentPreferences.travelers > 1 ? 's' : ''})`;
      await saveTrip(currentPreferences, itinerary, title);
      setIsSaved(true);
      await loadSavedTrips();
      showToast('Trip saved to your library!', 'success');

      try {
        confetti({
          particleCount: 45,
          spread: 45,
          origin: { y: 0.5 }
        });
      } catch {
        // ignore
      }
    } catch (err) {
      console.error('Error saving trip:', err);
      showToast(err.message || 'Failed to save trip.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Edit Activity handler
  const handleOpenEditActivity = (dayNumber, activityIndex, activity) => {
    setEditingActivityData({
      dayNumber,
      activityIndex,
      activity
    });
  };

  const handleSaveEditedActivity = (dayNumber, activityIndex, updatedActivity) => {
    setItinerary(prev => {
      if (!prev) return prev;
      const updatedDays = prev.days.map(d => {
        if (d.day_number !== dayNumber) return d;
        const acts = [...d.activities];
        acts[activityIndex] = updatedActivity;
        
        // Recalculate day cost
        const dayCost = acts.reduce((acc, a) => acc + (a.estimated_cost || 0), 0) +
          d.dining.reduce((acc, m) => acc + (m.estimated_cost || 0), 0);
        
        return {
          ...d,
          activities: acts,
          daily_estimated_cost: Math.round(dayCost * 10) / 10
        };
      });

      // Recalculate overall trip total
      const newTotal = updatedDays.reduce((acc, d) => acc + d.daily_estimated_cost, 0);
      const budget = prev.trip_summary.budget;
      const rem = budget - newTotal;
      let status = 'Within budget';
      if (rem >= 0.15 * budget) status = 'Under budget';
      else if (rem < 0) status = 'Budget stretched';

      return {
        ...prev,
        days: updatedDays,
        trip_summary: {
          ...prev.trip_summary,
          total_estimated_cost: Math.round(newTotal * 10) / 10,
          remaining_budget: Math.round(rem * 10) / 10,
          budget_status: status
        }
      };
    });

    setIsSaved(false);
    showToast('Activity updated and budget recalculated!', 'success');
  };

  // Load a saved trip into active planner view
  const handleLoadSavedTrip = (savedTrip) => {
    if (savedTrip.itinerary) {
      setItinerary(savedTrip.itinerary);
      setCurrentPreferences({
        destination: savedTrip.destination,
        start_date: savedTrip.start_date,
        end_date: savedTrip.end_date,
        budget: savedTrip.budget,
        currency: savedTrip.currency,
        travelers: savedTrip.travelers,
        travel_style: savedTrip.travel_style,
        interests: savedTrip.interests || [],
        dietary_preferences: savedTrip.dietary_preferences,
        accessibility_requirements: savedTrip.accessibility_requirements
      });
      setIsSaved(true);
      setActiveTab('planner');
      showToast(`Loaded ${savedTrip.title}`, 'info');
      scrollToSection('results-view');
    }
  };

  // Delete a saved trip
  const handleDeleteTrip = async (tripId) => {
    if (!window.confirm('Are you sure you want to delete this trip from your library?')) return;
    try {
      await deleteTrip(tripId);
      await loadSavedTrips();
      showToast('Trip removed from library', 'info');
    } catch (err) {
      console.error('Error deleting trip:', err);
      showToast('Failed to delete trip.', 'error');
    }
  };

  // Share Itinerary
  const handleShareItinerary = () => {
    if (!itinerary) return;
    const { destination, total_days, budget, currency, total_estimated_cost } = itinerary.trip_summary;
    const shareText = `WanderPlan AI Travel Itinerary: ${destination} (${total_days} Days) | Total Estimated: ${currency} ${total_estimated_cost} of ${currency} ${budget} budget.\nGenerated via WanderPlan AI.`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText).then(() => {
        showToast('Itinerary summary copied to clipboard!', 'success');
      });
    } else {
      showToast('Clipboard copy unavailable on this browser.', 'info');
    }
  };

  return (
    <div className="app-shell">
      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        savedCount={savedTrips.length}
        health={health}
        onOpenConfig={() => setIsConfigModalOpen(true)}
      />

      <main className="main-content">
        {activeTab === 'planner' ? (
          <>
            {/* Hero Section */}
            <Hero
              onSelectPreset={handleSelectPreset}
              onScrollToForm={() => scrollToSection('planner-form')}
            />

            <div className="content-container">
              {/* Trip Configuration Form */}
              <TripForm
                initialValues={currentPreferences}
                onSubmit={handleGenerate}
                isLoading={isGenerating}
              />

              {/* Itinerary Results Dashboard */}
              {itinerary && (
                <div id="results-view" className="results-container mt-8">
                  {/* Summary & Budget Header */}
                  <TripSummary
                    itinerary={itinerary}
                    isSaved={isSaved}
                    onSaveTrip={handleSaveTrip}
                    isSaving={isSaving}
                    onRegenerateAll={handleRegenerateAll}
                    isRegenerating={isRegeneratingAll}
                    onShare={handleShareItinerary}
                  />

                  {/* Day by Day Cards */}
                  <div className="days-stack mt-6">
                    <div className="days-stack-header">
                      <h2 className="days-heading">Your Day-by-Day Journey</h2>
                      <span className="days-sub">
                        Click any day to expand or edit individual activities
                      </span>
                    </div>

                    {itinerary.days.map(day => (
                      <DayCard
                        key={day.day_number}
                        day={day}
                        currency={itinerary.trip_summary.currency}
                        onRegenerateDay={handleRegenerateDay}
                        isRegenerating={regeneratingDayNumber === day.day_number}
                        onEditActivity={handleOpenEditActivity}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="content-container mt-6">
            <SavedTrips
              savedTrips={savedTrips}
              onLoadTrip={handleLoadSavedTrip}
              onDeleteTrip={handleDeleteTrip}
              onGoToPlanner={() => setActiveTab('planner')}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <p className="footer-brand">
            WanderPlan AI • Personalized Travel Itinerary Planner
          </p>
          <p className="footer-credits">
            Powered by FastAPI, Google Gemini Generative AI, and Supabase PostgreSQL.
          </p>
        </div>
      </footer>

      {/* Edit Activity Modal */}
      {editingActivityData && (
        <EditActivityModal
          key={`${editingActivityData.dayNumber}-${editingActivityData.activityIndex}`}
          isOpen={Boolean(editingActivityData)}
          onClose={() => setEditingActivityData(null)}
          dayNumber={editingActivityData.dayNumber}
          activityIndex={editingActivityData.activityIndex}
          activity={editingActivityData.activity}
          currency={itinerary?.trip_summary?.currency || 'USD'}
          onSave={handleSaveEditedActivity}
        />
      )}

      {/* System Credentials & Viva Guide Modal */}
      <ConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        health={health}
      />
    </div>
  );
}
