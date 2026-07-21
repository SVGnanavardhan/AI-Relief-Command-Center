import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { supabase } from '../lib/format';
import {
  UserCircle2, ShieldCheck, FileText, Map, ListOrdered,
  Briefcase, Settings, Star, CheckCircle, XCircle,
} from 'lucide-react';

interface UserProfile {
  name: string;
  email: string;
  role: string;
  phone?: string;
  created_at?: string;
}

const ROLE_CONFIG: Record<string, { label: string; badge: string; description: string }> = {
  administrator:      { label: 'Administrator',      badge: 'bg-rose-100 text-rose-700 border-rose-200',     description: 'Full system access and administrative controls' },
  operations_officer: { label: 'Operations Officer', badge: 'bg-indigo-100 text-indigo-700 border-indigo-200', description: 'Manages operations, dispatch, and team coordination' },
  rescue_team:        { label: 'Rescue Team',        badge: 'bg-sky-100 text-sky-700 border-sky-200',         description: 'Field responder with incident visibility' },
  citizen:            { label: 'Citizen',             badge: 'bg-slate-100 text-slate-700 border-slate-200',   description: 'Can submit incident reports and track status' },
};

interface Permission { label: string; icon: typeof FileText; allowed: boolean }

function getPermissions(role: string): Permission[] {
  const isAdmin  = role === 'administrator';
  const isOfficer = isAdmin || role === 'operations_officer';
  const isTeam   = isOfficer || role === 'rescue_team';

  return [
    { label: 'Submit incident reports',       icon: FileText,    allowed: true },
    { label: 'View real-time dashboard',      icon: Star,        allowed: true },
    { label: 'View interactive map',          icon: Map,         allowed: true },
    { label: 'Access priority queue',         icon: ListOrdered, allowed: isTeam },
    { label: 'Operations & team dispatch',    icon: Briefcase,   allowed: isOfficer },
    { label: 'Admin controls & auto-assign',  icon: ShieldCheck, allowed: isAdmin },
    { label: 'System settings',               icon: Settings,    allowed: isAdmin },
  ];
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token || localStorage.getItem('access_token');
        if (!token) { navigate('/'); return; }

        const res = await api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
        setProfile(res.data);
        // Refresh stored user
        localStorage.setItem('auth_user', JSON.stringify(res.data));
      } catch {
        const stored = localStorage.getItem('auth_user');
        if (stored) {
          try { setProfile(JSON.parse(stored)); } catch { navigate('/'); }
        } else {
          navigate('/');
        }
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [navigate]);

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
    </div>
  );
  if (!profile) return null;

  const roleConf = ROLE_CONFIG[profile.role] ?? ROLE_CONFIG.citizen;
  const permissions = getPermissions(profile.role);
  const initials = profile.name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || '?';

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      {/* Header card */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-8 text-white shadow-lg">
        <div className="flex flex-wrap items-center gap-6">
          {/* Avatar */}
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 text-2xl font-bold ring-2 ring-white/20">
            {initials}
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">Responder Profile</p>
            <h2 className="mt-1 text-2xl font-bold">{profile.name}</h2>
            <p className="mt-1 text-sm text-slate-300">{profile.email}</p>
            <div className="mt-3">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${roleConf.badge}`}>
                <ShieldCheck className="h-3 w-3" />
                {roleConf.label}
              </span>
            </div>
          </div>
        </div>
        <p className="mt-5 text-sm text-slate-400">{roleConf.description}</p>
      </div>

      {/* Details */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Account Information</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {[
            { label: 'Full Name',   value: profile.name },
            { label: 'Email',       value: profile.email },
            { label: 'Role',        value: roleConf.label },
            { label: 'Phone',       value: profile.phone || '—' },
            { label: 'Member Since', value: formatDate(profile.created_at) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Permissions */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <UserCircle2 className="h-5 w-5 text-slate-400" />
          <h3 className="text-base font-semibold text-slate-900">Access Permissions</h3>
        </div>
        <p className="mt-1 text-sm text-slate-500">Based on your <strong>{roleConf.label}</strong> role</p>
        <div className="mt-4 divide-y divide-slate-100">
          {permissions.map(({ label, icon: Icon, allowed }) => (
            <div key={label} className="flex items-center gap-3 py-3">
              <Icon className="h-4 w-4 shrink-0 text-slate-400" />
              <span className={`flex-1 text-sm ${allowed ? 'text-slate-800' : 'text-slate-400'}`}>{label}</span>
              {allowed ? (
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
              ) : (
                <XCircle className="h-4 w-4 shrink-0 text-slate-300" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
