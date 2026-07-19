import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white/90 px-6 py-24 text-center shadow-sm">
      <div className="rounded-2xl bg-rose-100 p-3 text-rose-700">
        <AlertTriangle className="h-6 w-6" aria-hidden />
      </div>
      <p className="text-4xl font-bold text-slate-900">404</p>
      <p className="max-w-md text-slate-500">The requested incident view is unavailable, but the command center is still fully operational.</p>
      <Link to="/" className="mt-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800">
        Back to Dashboard
      </Link>
    </div>
  );
}
