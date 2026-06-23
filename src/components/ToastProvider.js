import React, { createContext, useContext, useState, useCallback } from "react";
import Toast from "./Toast";

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, type = "success", options = {}) => {
    const duration = options.duration ?? 3000;
    const action = options.action ?? null;
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, duration, action }]);
  }, []);

  const showUndoToast = useCallback(
    (message, onUndo, type = "info") => {
      showToast(message, type, {
        duration: 8000,
        action: {
          label: "Undo",
          onClick: onUndo,
        },
      });
    },
    [showToast],
  );

  return (
    <ToastContext.Provider value={{ showToast, showUndoToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            action={toast.action}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
