import { X } from 'lucide-react';

export interface ToastItem {
  id: number;
  message: string;
  tone?: 'info' | 'success' | 'error';
}

interface ToastViewportProps {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}

const toneClassName: Record<NonNullable<ToastItem['tone']>, string> = {
  info: 'border-slate-200 bg-slate-900 text-white',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error: 'border-rose-200 bg-rose-50 text-rose-700',
};

export default function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  if (!toasts.length) return null;

  return (
    <div className="fixed right-4 top-4 z-[1000] flex w-[min(92vw,24rem)] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur ${toneClassName[toast.tone ?? 'info']}`}
        >
          <p className="text-sm font-medium">{toast.message}</p>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => onDismiss(toast.id)}
            className="rounded-full p-1 transition hover:bg-black/5"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
}
