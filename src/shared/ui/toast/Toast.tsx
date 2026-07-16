import { useEffect } from "react";
import "./Toast.css";

type ToastProps = {
  message: string;
  onClose: () => void;
  type: "danger" | "success";
};

export function Toast({ message, onClose, type }: ToastProps) {
  useEffect(() => {
    const timeout = window.setTimeout(onClose, 3000);
    return () => window.clearTimeout(timeout);
  }, [message, onClose]);

  return (
    <div className={`toast toast--${type}`} role={type === "danger" ? "alert" : "status"}>
      <span className="toast__icon" aria-hidden="true">{type === "success" ? "✓" : "!"}</span>
      <strong>{message}</strong>
      <button type="button" onClick={onClose} aria-label="Zamknij komunikat">×</button>
    </div>
  );
}
