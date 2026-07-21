import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import {
  UserCircle2, ShieldCheck, FileText, Map, ListOrdered,
  Briefcase, Settings, CheckCircle, XCircle, RefreshCw,
} from 'lucide-react';

interface UserProfile {
  id?: string | number;
  name: string;
  email: string;
  role: string;
  phone?: string;
  avatar?: string;
  created_at?: string;
}

const ROLE_CONFIG: Record<string, { label: string; badge: string; description: string }> = {
  administrator:      { label: 'Administrator',      badge: 'bg-rose-100 text-rose-700 border-rose-200',       description: 'Full system access and administrative controls' },
  operations_officer: { label: 'Operations Officer', badge: 'bg-indigo-100 text-indigo-700 border-indigo-200', description: 'Manages operations, dispatch, and team coordination' },
  rescue_team:        { label: 'Rescue Team',        badge: 'bg-sky-100 text-sky-700 border-sky-200',         description: 'Field responder with incident visibility' },
  citizen:            { label: 'Citizen',             badge: 'bg-slate-100 text-slate-700 border-slate-200',   description: 'Can submit incident reports and track status' },
};

interface Permission { label: string; icon: typeof FileText; allowed: boolean }

function getPermissions(role: string): Permission[] {
  const isAdmin   = role === 'administrator';
  const isOfficer = isAdmin || role === 'operations_officer';
  const isTeam    = isOfficer || role === 'rescue_team';

  return [
    { label: 'Submit incident reports',       icon: FileText,    allowed: true },
    { label: 'View real-time dashboard',      icon: ShieldCheck, allowed: true },
    { label: 'View interactive map',          icon: Map,         allowed: true },
    { label: 'Access priority queue',         icon: ListOrdered, allowed: isTeam },
    { label: 'Operations & team dispatch',    icon: Briefcase,   allowed: isOfficer },
    { label: 'Admin controls & auto-assign',  icon: ShieldCheck, allowed: isAdmin },
    { label: 'System settings',               icon: Settings,    allowed: isAdmin },
  ];
}

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function Profile() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    if (auth.loading) return; // Wait for auth to resolve

    if (!auth.session) {
      navigate('/');
      return;
    }

    async function loadProfile() {
      setFetchError(false);
      try {
        // api client already attaches the Supabase token via interceptor
        const res = await api.get('/auth/me');
        setProfile(res.data);
        localStorage.setItem('auth_user', JSON.stringify(res.data));
      } catch (err) {
        console.warn('[Profile] API fetch failed, using fallback data', err);
        setFetchError(true);

        // Fallback 1: try localStorage
        const stored = localStorage.getItem('auth_user');
        if (stored) {
          try {
            setProfile(JSON.parse(stored));
            return;
          } catch { /* ignore parse errors */ }
        }

        // Fallback 2: build from Supabase session data
        if (auth.user) {
          setProfile({
            name: auth.name,
            email: auth.user.email ?? '',
            role: auth.role,
            phone: auth.user.user_metadata?.phone ?? '',
            created_at: auth.user.created_at,
          });
        }
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [auth.loading, auth.session, auth.user, auth.name, auth.role, navigate]);

  if (auth.loading || loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
        <p className="text-sm text-slate-400">Loading profile…</p>
      </div>
    </div>
  );

  if (!profile) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <p className="text-sm text-slate-500">Unable to load profile data.</p>
        <button onClick={() => navigate(0)} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white">
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      </div>
    </div>
  );

  const roleConf = ROLE_CONFIG[profile.role] ?? ROLE_CONFIG.citizen;
  const permissions = getPermissions(profile.role);
  const initials = (profile.name || 'U')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      {/* API error banner */}
      {fetchError && (
        <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>Showing cached profile. Live data unavailable — check your connection.</span>
        </div>
      )}

      {/* Header card */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-8 text-white shadow-lg">
        <div className="flex flex-wrap items-center gap-6">
          {/* Avatar */}
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-2xl font-bold shadow-lg ring-2 ring-white/20">
            {initials}
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">Responder Profile</p>
            <h2 className="mt-1 text-2xl font-bold">{profile.name || 'Unknown User'}</h2>
            <p className="mt-1 text-sm text-slate-300">{profile.email || '—'}</p>
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
            { label: 'Full Name',    value: profile.name || '—' },
            { label: 'Email',        value: profile.email || '—' },
            { label: 'Role',         value: roleConf.label },
            { label: 'Phone',        value: profile.phone || '—' },
            { label: 'Member Since', value: formatDate(profile.created_at) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 transition-all duration-200 hover:border-slate-200 hover:shadow-sm">
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
            <div key={label} className="flex items-center gap-3 py-3 transition-colors duration-150 hover:bg-slate-50 rounded-lg px-2 -mx-2">
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
