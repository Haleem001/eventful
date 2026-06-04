import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}

      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 w-[calc(100%-2.5rem)] max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto px-4 py-3 rounded-xl shadow-2xl backdrop-blur-xl border flex items-center gap-3 animate-[slideUp_0.3s_ease-out] ${
              t.type === "success"
                ? "bg-primary-container/90 border-primary/30 text-on-primary-container"
                : t.type === "error"
                  ? "bg-error-container/90 border-error/30 text-on-error-container"
                  : "bg-surface-container/90 border-outline-variant/50 text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[18px] shrink-0">
              {t.type === "success" ? "check_circle" : t.type === "error" ? "error_outline" : "info"}
            </span>
            <p className="font-body-md text-body-md flex-1">{t.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
