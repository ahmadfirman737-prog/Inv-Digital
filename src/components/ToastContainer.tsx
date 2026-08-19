import React from 'react';
import { ToastNotification } from '../types';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

interface ToastContainerProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div id="toast-container" className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3">
      {toasts.map((toast) => {
        let bgClass = 'bg-blue-600 text-white border-blue-700';
        let Icon = Info;

        if (toast.type === 'success') {
          bgClass = 'bg-emerald-600 text-white border-emerald-700';
          Icon = CheckCircle2;
        } else if (toast.type === 'error') {
          bgClass = 'bg-rose-600 text-white border-rose-700';
          Icon = AlertCircle;
        } else if (toast.type === 'warning') {
          bgClass = 'bg-amber-600 text-white border-amber-700';
          Icon = AlertTriangle;
        }

        return (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl shadow-lg border ${bgClass} transition-all duration-300 transform translate-y-0`}
          >
            <div className="flex items-center gap-3 pr-2">
              <Icon className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium leading-snug">{toast.message}</p>
            </div>
            <button
              id={`dismiss-toast-${toast.id}`}
              onClick={() => onDismiss(toast.id)}
              className="p-1 hover:bg-black/15 rounded-lg transition-colors flex-shrink-0"
              aria-label="Tutup notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
