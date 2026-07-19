import type { Priority } from '../types';
import { priorityConfig } from '../lib/format';

export default function PriorityBadge({ priority }: { priority: Priority }) {
  const cfg = priorityConfig[priority];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm ${cfg.badge}`}
    >
      <span className="mr-1.5 h-2 w-2 rounded-full bg-current" aria-hidden />
      {cfg.label}
    </span>
  );
}
