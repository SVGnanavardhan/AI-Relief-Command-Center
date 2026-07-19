import { Ambulance, ShipWheel, HeartPulse, UtensilsCrossed, Home, Flame, Wrench, Package2 } from 'lucide-react';

const RESOURCE_STYLES: Record<string, { icon: typeof Ambulance; label: string; className: string }> = {
  ambulance: { icon: Ambulance, label: 'Ambulance', className: 'bg-rose-100 text-rose-700' },
  rescue: { icon: ShipWheel, label: 'Rescue Boat', className: 'bg-sky-100 text-sky-700' },
  medical: { icon: HeartPulse, label: 'Medical Team', className: 'bg-amber-100 text-amber-700' },
  food: { icon: UtensilsCrossed, label: 'Food Supply', className: 'bg-emerald-100 text-emerald-700' },
  shelter: { icon: Home, label: 'Shelter Kits', className: 'bg-violet-100 text-violet-700' },
  fire: { icon: Flame, label: 'Fire Support', className: 'bg-orange-100 text-orange-700' },
  infrastructure: { icon: Wrench, label: 'Infrastructure', className: 'bg-slate-100 text-slate-700' },
};

function normalizeResource(value: string): string {
  const normalized = value.toLowerCase();
  if (normalized.includes('ambul')) return 'ambulance';
  if (normalized.includes('boat') || normalized.includes('rescue')) return 'rescue';
  if (normalized.includes('medical') || normalized.includes('doctor') || normalized.includes('health')) return 'medical';
  if (normalized.includes('food') || normalized.includes('water') || normalized.includes('meal')) return 'food';
  if (normalized.includes('shelter') || normalized.includes('home')) return 'shelter';
  if (normalized.includes('fire')) return 'fire';
  if (normalized.includes('infra') || normalized.includes('repair') || normalized.includes('road') || normalized.includes('power')) return 'infrastructure';
  return 'default';
}

export default function ResourceBadges({ resources }: { resources?: string[] | null }) {
  const items = Array.isArray(resources) ? resources.filter(Boolean) : [];

  if (!items.length) {
    return <p className="text-sm text-slate-500">No resource suggestions available.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((resource, index) => {
        const key = normalizeResource(resource);
        const config = RESOURCE_STYLES[key] ?? {
          icon: Package2,
          label: resource,
          className: 'bg-slate-100 text-slate-700',
        };
        const Icon = config.icon;
        return (
          <span key={`${resource}-${index}`} className={`inline-flex items-center gap-2 rounded-full border border-transparent px-3 py-1 text-sm font-medium ${config.className}`}>
            <Icon className="h-4 w-4" aria-hidden />
            {config.label}
          </span>
        );
      })}
    </div>
  );
}
