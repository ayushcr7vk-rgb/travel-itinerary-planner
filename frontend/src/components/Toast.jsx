import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 size={18} className="toast-icon success" />;
      case 'error':
        return <AlertCircle size={18} className="toast-icon error" />;
      default:
        return <Info size={18} className="toast-icon info" />;
    }
  };

  return (
    <div className={`toast-container toast-${toast.type || 'info'}`} role="status">
      <div className="toast-body">
        {getIcon()}
        <span className="toast-message">{toast.message}</span>
      </div>
      <button 
        type="button" 
        className="toast-close" 
        onClick={onClose}
        aria-label="Close notification"
      >
        <X size={14} />
      </button>
    </div>
  );
}
