import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateCardProps {
  title: string;
  description: string;
  icon?: ReactNode;
}

export default function EmptyStateCard({ title, description, icon }: EmptyStateCardProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-10 text-center text-slate-500">
      <div className="rounded-full bg-white p-3 shadow-sm">{icon ?? <Inbox className="h-5 w-5" />}</div>
      <h3 className="mt-4 text-base font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
    </div>
  );
}
