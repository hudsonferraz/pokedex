import React, { useEffect } from "react";
import "./Toast.css";

const Toast = ({ message, type = "success", onClose, duration = 3000, action = null }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`toast toast-${type}`}>
      <span className="toast-message">{message}</span>
      {action && (
        <button
          type="button"
          className="toast-action"
          onClick={() => {
            action.onClick?.();
            onClose();
          }}
        >
          {action.label || "Undo"}
        </button>
      )}
      <button type="button" className="toast-close" onClick={onClose} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
};

export default Toast;
