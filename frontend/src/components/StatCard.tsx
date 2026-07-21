import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  accent?: string;
  loading?: boolean;
  description?: string;
  clickable?: boolean;
  onClick?: () => void;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'bg-slate-900 text-white',
  loading,
  description,
  clickable = false,
  onClick,
}: StatCardProps) {
  const content = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-1 text-3xl font-semibold tabular-nums text-slate-900">
          {loading ? '—' : value}
        </p>
        {description ? <p className="mt-1 text-xs text-slate-500">{description}</p> : null}
      </div>
      <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${accent} transition-transform duration-200 group-hover:scale-110`}>
        <Icon className="h-5 w-5" aria-hidden />
      </div>
    </div>
  );

  if (!clickable) {
    return (
      <div className="group rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-2xl border border-slate-200 bg-white/90 p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-slate-900/10"
    >
      {content}
    </button>
  );
}

