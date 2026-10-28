/**
 * API Service for Personalized Travel Itinerary Planner
 * Automatically uses Vite proxy or configurable VITE_API_BASE_URL.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function handleResponse(response) {
  if (!response.ok) {
    let errorDetail = 'An unexpected error occurred.';
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        if (Array.isArray(errJson.detail)) {
          errorDetail = errJson.detail.map(d => `${d.loc ? d.loc.join('.') + ': ' : ''}${d.msg}`).join(', ');
        } else {
          errorDetail = errJson.detail;
        }
      }
    } catch {
      errorDetail = `Server returned status ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorDetail);
  }
  return response.json();
}

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return handleResponse(res);
}

export async function generateItinerary(preferences) {
  const res = await fetch(`${API_BASE}/api/itinerary/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(preferences)
  });
  return handleResponse(res);
}

export async function regenerateDay(preferences, dayNumber, date, focusNote = '') {
  const res = await fetch(`${API_BASE}/api/itinerary/regenerate-day`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      preferences,
      day_number: dayNumber,
      date,
      focus_note: focusNote
    })
  });
  return handleResponse(res);
}

export async function regenerateItinerary(preferences, specialInstructions = '') {
  const res = await fetch(`${API_BASE}/api/itinerary/regenerate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      preferences,
      special_instructions: specialInstructions
    })
  });
  return handleResponse(res);
}

export async function getSavedTrips() {
  const res = await fetch(`${API_BASE}/api/trips`);
  return handleResponse(res);
}

export async function saveTrip(preferences, itinerary, title = '', notes = '') {
  const res = await fetch(`${API_BASE}/api/trips`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: title || `${preferences.destination} Expedition`,
      preferences,
      itinerary,
      notes
    })
  });
  return handleResponse(res);
}

export async function updateTrip(tripId, updates) {
  const res = await fetch(`${API_BASE}/api/trips/${tripId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  return handleResponse(res);
}

export async function deleteTrip(tripId) {
  const res = await fetch(`${API_BASE}/api/trips/${tripId}`, {
    method: 'DELETE'
  });
  return handleResponse(res);
}
