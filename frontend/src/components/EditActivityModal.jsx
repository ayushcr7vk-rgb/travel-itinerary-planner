import React, { useState, useEffect, useRef } from 'react';
import { X, Save, DollarSign, Clock, MapPin, Navigation } from 'lucide-react';

export default function EditActivityModal({ 
  isOpen, 
  onClose, 
  dayNumber, 
  activityIndex, 
  activity, 
  currency, 
  onSave 
}) {
  const dialogRef = useRef(null);

  const [title, setTitle] = useState(activity?.title || '');
  const [description, setDescription] = useState(activity?.description || '');
  const [location, setLocation] = useState(activity?.location || '');
  const [suggestedTransportation, setSuggestedTransportation] = useState(activity?.suggested_transportation || '');
  const [estimatedCost, setEstimatedCost] = useState(activity?.estimated_cost || 0);
  const [durationHours, setDurationHours] = useState(activity?.duration_hours || 2);
  const [category, setCategory] = useState(activity?.category || 'sightseeing');

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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(dayNumber, activityIndex, {
      ...activity,
      title,
      description,
      location,
      suggested_transportation: suggestedTransportation,
      estimated_cost: Number(estimatedCost),
      duration_hours: Number(durationHours),
      category
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className="native-dialog"
      aria-labelledby="edit-activity-title"
      onCancel={onClose}
    >
      <div className="dialog-header">
        <div>
          <span className="dialog-tag">Day {dayNumber} • {activity?.time_slot} Activity</span>
          <h3 id="edit-activity-title" className="dialog-title">Edit Itinerary Activity</h3>
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

      <form onSubmit={handleSubmit} className="dialog-form">
        <div className="form-group">
          <label className="form-label" htmlFor="edit-title">Activity Title</label>
          <input
            id="edit-title"
            type="text"
            className="form-input"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="edit-desc">Description</label>
          <textarea
            id="edit-desc"
            className="form-textarea"
            rows="3"
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
          />
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label" htmlFor="edit-loc">
              <MapPin size={14} className="label-icon text-accent" />
              <span>Location / Address</span>
            </label>
            <input
              id="edit-loc"
              type="text"
              className="form-input"
              value={location}
              onChange={e => setLocation(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-transit">
              <Navigation size={14} className="label-icon text-accent" />
              <span>Suggested Transportation</span>
            </label>
            <input
              id="edit-transit"
              type="text"
              className="form-input"
              value={suggestedTransportation}
              onChange={e => setSuggestedTransportation(e.target.value)}
            />
          </div>
        </div>

        <div className="form-grid-3">
          <div className="form-group">
            <label className="form-label" htmlFor="edit-cost">
              <DollarSign size={14} className="label-icon text-accent" />
              <span>Cost ({currency})</span>
            </label>
            <input
              id="edit-cost"
              type="number"
              min="0"
              step="1"
              className="form-input"
              value={estimatedCost}
              onChange={e => setEstimatedCost(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-duration">
              <Clock size={14} className="label-icon text-accent" />
              <span>Duration (Hours)</span>
            </label>
            <input
              id="edit-duration"
              type="number"
              min="0.5"
              max="12"
              step="0.5"
              className="form-input"
              value={durationHours}
              onChange={e => setDurationHours(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-cat">Category</label>
            <select
              id="edit-cat"
              className="form-select"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              <option value="sightseeing">Sightseeing</option>
              <option value="history">History</option>
              <option value="culture">Culture</option>
              <option value="nature">Nature</option>
              <option value="adventure">Adventure</option>
              <option value="food">Food</option>
              <option value="shopping">Shopping</option>
              <option value="relaxation">Relaxation</option>
            </select>
          </div>
        </div>

        <div className="dialog-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            <Save size={16} />
            <span>Save & Recalculate Budget</span>
          </button>
        </div>
      </form>
    </dialog>
  );
}
