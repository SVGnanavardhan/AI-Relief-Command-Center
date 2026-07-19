import {
  Droplets,
  Flame,
  HeartPulse,
  Home,
  ShieldAlert,
  ShipWheel,
  UtensilsCrossed,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { Category, Priority } from '../types';

export function formatTimestamp(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(iso: string): string {
  if (!iso) return 'just now';
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

export const priorityConfig: Record<
  Priority,
  { label: string; color: string; badge: string; marker: string; ring: string }
> = {
  critical: {
    label: 'Critical',
    color: '#dc2626',
    badge: 'bg-red-100 text-red-700 border-red-200',
    marker: '#dc2626',
    ring: 'ring-red-500/20',
  },
  high: {
    label: 'High',
    color: '#ea580c',
    badge: 'bg-orange-100 text-orange-700 border-orange-200',
    marker: '#ea580c',
    ring: 'ring-orange-500/20',
  },
  medium: {
    label: 'Medium',
    color: '#ca8a04',
    badge: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    marker: '#ca8a04',
    ring: 'ring-amber-500/20',
  },
  low: {
    label: 'Low',
    color: '#16a34a',
    badge: 'bg-green-100 text-green-700 border-green-200',
    marker: '#16a34a',
    ring: 'ring-emerald-500/20',
  },
};

export const categoryConfig: Record<
  Category,
  { label: string; icon: LucideIcon; accent: string; description: string }
> = {
  medical: {
    label: 'Medical',
    icon: HeartPulse,
    accent: 'bg-rose-100 text-rose-700',
    description: 'Urgent healthcare response',
  },
  rescue: {
    label: 'Rescue',
    icon: ShipWheel,
    accent: 'bg-sky-100 text-sky-700',
    description: 'Search and evacuation needs',
  },
  shelter: {
    label: 'Shelter',
    icon: Home,
    accent: 'bg-violet-100 text-violet-700',
    description: 'Safe housing and relief support',
  },
  food: {
    label: 'Food',
    icon: UtensilsCrossed,
    accent: 'bg-emerald-100 text-emerald-700',
    description: 'Nutritional distribution',
  },
  fire: {
    label: 'Fire',
    icon: Flame,
    accent: 'bg-orange-100 text-orange-700',
    description: 'Fire suppression support',
  },
  flood: {
    label: 'Flood',
    icon: Droplets,
    accent: 'bg-cyan-100 text-cyan-700',
    description: 'Waterlogging and evacuation',
  },
  road: {
    label: 'Road',
    icon: Wrench,
    accent: 'bg-slate-100 text-slate-700',
    description: 'Access route clearance',
  },
  other: {
    label: 'Other',
    icon: ShieldAlert,
    accent: 'bg-amber-100 text-amber-700',
    description: 'Additional support requests',
  },
};

export function priorityFromScore(score: number): Priority {
  if (score >= 0.85) return 'critical';
  if (score >= 0.65) return 'high';
  if (score >= 0.35) return 'medium';
  return 'low';
}

export function formatMetricValue(value: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);
}
