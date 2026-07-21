import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  UserCircle2,
  Settings as SettingsIcon,
  LogOut,
  LayoutDashboard,
  FilePlus2,
  ListOrdered,
  Map as MapIcon,
  ShieldAlert,
  Briefcase,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { supabase } from '../lib/format';
import { useAuth } from '../hooks/useAuth';

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/submit',    label: 'Submit Report', icon: FilePlus2 },
  { to: '/queue',     label: 'Priority Queue', icon: ListOrdered },
  { to: '/map',       label: 'Map', icon: MapIcon },
  { to: '/operations', label: 'Operations', icon: Briefcase },
];

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  administrator:       { label: 'Admin',     color: 'bg-rose-500/15 text-rose-400 border-rose-500/20' },
  operations_officer:  { label: 'Officer',   color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20' },
  rescue_team:         { label: 'Rescue',    color: 'bg-sky-500/15 text-sky-400 border-sky-500/20' },
  citizen:             { label: 'Citizen',   color: 'bg-slate-500/15 text-slate-400 border-slate-500/20' },
};

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, name } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  async function handleLogout() {
    setMenuOpen(false);
    await supabase.auth.signOut();
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth_user');
    navigate('/');
  }

  const roleInfo = ROLE_LABELS[role] ?? ROLE_LABELS.citizen;
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.08),_transparent_50%),linear-gradient(to_bottom,_#f8fafc,_#eef2ff_40%,_#f8fafc)] text-slate-800">
      {/* ── Top Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: Logo + Hamburger */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              id="btn-menu-toggle"
              onClick={() => setMenuOpen(!menuOpen)}
              className="group flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow active:scale-95"
              aria-label="Toggle menu"
            >
              <div className="transition-transform duration-200 ease-out group-hover:scale-110">
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </div>
            </button>

            <NavLink to="/dashboard" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg shadow-rose-500/25">
                <ShieldAlert className="h-4.5 w-4.5 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="text-sm font-bold text-slate-900">AI Relief</span>
                <span className="ml-1 text-xs font-medium text-slate-400">Command Center</span>
              </div>
            </NavLink>
          </div>

          {/* Center: Desktop nav links */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {nav.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `group relative flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" aria-hidden />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Right: User badge */}
          <div className="flex items-center gap-3">
            {user && (
              <>
                <NavLink
                  to="/profile"
                  className="group hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm transition-all hover:border-slate-300 hover:shadow sm:flex"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 text-[11px] font-bold text-white transition-transform duration-200 group-hover:scale-105">
                    {initials || '?'}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-800">{name}</span>
                    <span className={`inline-block rounded-full border px-1.5 py-px text-[9px] font-bold uppercase tracking-wider ${roleInfo.color}`}>
                      {roleInfo.label}
                    </span>
                  </div>
                </NavLink>
                <button
                  type="button"
                  id="btn-logout-nav"
                  onClick={handleLogout}
                  className="hidden items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-rose-500 transition-all hover:bg-rose-50 hover:text-rose-600 active:scale-95 sm:flex"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Slide-over Menu (Mobile + hamburger) ── */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={menuRef}
        className={`fixed left-0 top-0 z-[70] flex h-full w-80 max-w-[85vw] flex-col bg-slate-950 shadow-2xl transition-transform duration-300 ease-out ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Menu header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-600">
              <ShieldAlert className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">AI Relief</div>
              <div className="text-[10px] font-medium text-slate-400">Command Center</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User card in menu */}
        {user && (
          <div className="border-b border-white/10 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-sm font-bold text-white shadow-lg">
                {initials || '?'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-white">{name}</div>
                <div className="mt-0.5 text-xs text-slate-400">{user.email}</div>
                <span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${roleInfo.color}`}>
                  {roleInfo.label}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Mobile navigation">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Navigation</p>
          {nav.map(({ to, label, icon: Icon, end }, idx) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`
              }
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" aria-hidden />
                {label}
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-slate-600 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-slate-400" />
            </NavLink>
          ))}

          {user && (
            <>
              <div className="my-3 border-t border-white/5" />
              <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Account</p>

              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <UserCircle2 className="h-4 w-4" aria-hidden />
                  Profile
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-slate-600 transition-transform duration-200 group-hover:translate-x-0.5" />
              </NavLink>

              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <SettingsIcon className="h-4 w-4" aria-hidden />
                  Settings
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-slate-600 transition-transform duration-200 group-hover:translate-x-0.5" />
              </NavLink>
            </>
          )}
        </nav>

        {/* Menu footer */}
        {user && (
          <div className="border-t border-white/10 px-3 py-4">
            <button
              type="button"
              id="btn-logout-menu"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-400 transition-all duration-200 hover:bg-rose-500/10 hover:text-rose-300 active:scale-[0.98]"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Sign out
            </button>
          </div>
        )}

        {!user && (
          <div className="border-t border-white/10 px-3 py-4">
            <NavLink
              to="/"
              className="flex w-full items-center gap-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:from-cyan-400 hover:to-indigo-400 active:scale-[0.98]"
            >
              Sign In / Sign Up
            </NavLink>
          </div>
        )}
      </div>

      {/* ── Main Content ── */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
