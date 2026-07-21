import { AlertTriangle, Loader2, Inbox } from 'lucide-react';

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 px-6 py-14 shadow-sm">
      <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 text-slate-600">
        <Loader2 className="h-5 w-5 animate-spin text-slate-700" aria-hidden />
        <span className="font-medium">{label}</span>
      </div>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-10 text-red-700 shadow-sm">
      <AlertTriangle className="h-5 w-5" aria-hidden />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-10 text-center text-slate-500">
      <Inbox className="h-5 w-5" aria-hidden />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}
