"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

const ToastContext = React.createContext<{
  showToast: (message: string, type?: "success" | "error" | "info") => void;
}>({
  showToast: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const showToast = React.useCallback(
    (message: string, type: "success" | "error" | "info" = "success") => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, message }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl border shadow-2xl backdrop-blur-md transition-all animate-slide-up text-sm font-medium ${
              toast.type === "error"
                ? "bg-destructive/90 text-white border-destructive"
                : "bg-surface/95 text-foreground border-accent/40 shadow-[0_0_20px_rgba(200,255,0,0.1)]"
            }`}
          >
            <div className="flex items-center gap-3">
              {toast.type === "error" ? (
                <AlertCircle className="h-5 w-5 text-destructive-foreground shrink-0" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-muted hover:text-foreground transition-colors ml-3"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return React.useContext(ToastContext);
}
