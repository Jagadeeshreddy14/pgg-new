import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, AlertTriangle, Info, ShieldCheck, XCircle } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  title?: string;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, title?: string) => void;
  removeToast: (id: string) => void;
  toasts: Toast[];
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = "success", title?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toast, removeToast, toasts }}>
      {children}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col space-y-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            let icon = <Info className="w-5 h-5 text-blue-400" />;
            let borderColor = "border-blue-500/30";
            let bgColor = "bg-slate-900/90";
            let titleColor = "text-blue-400";
            
            if (t.type === "success") {
              icon = <ShieldCheck className="w-5 h-5 text-emerald-400" />;
              borderColor = "border-emerald-500/30";
              titleColor = "text-emerald-400";
            } else if (t.type === "error") {
              icon = <XCircle className="w-5 h-5 text-rose-400" />;
              borderColor = "border-rose-500/30";
              titleColor = "text-rose-400";
            } else if (t.type === "warning") {
              icon = <AlertTriangle className="w-5 h-5 text-amber-400" />;
              borderColor = "border-amber-500/30";
              titleColor = "text-amber-400";
            }

            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15 } }}
                className={`pointer-events-auto flex items-start space-x-3.5 p-4 rounded-2xl border ${borderColor} ${bgColor} shadow-2xl backdrop-blur-md`}
              >
                <div className="shrink-0 mt-0.5">{icon}</div>
                <div className="flex-1 min-w-0">
                  {t.title || t.type !== "info" ? (
                    <p className={`text-xs font-bold font-display ${titleColor} uppercase tracking-wider`}>
                      {t.title || (t.type === "success" ? "Success" : t.type === "error" ? "Failure Alert" : t.type === "warning" ? "Notice" : "Information")}
                    </p>
                  ) : null}
                  <p className="text-slate-200 text-xs mt-0.5 leading-relaxed font-sans">{t.message}</p>
                </div>
                <button
                  onClick={() => removeToast(t.id)}
                  className="shrink-0 p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
