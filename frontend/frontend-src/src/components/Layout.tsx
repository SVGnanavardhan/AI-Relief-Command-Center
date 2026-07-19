import { NavLink, Outlet } from 'react-router-dom';
import { LogIn, UserPlus, UserCircle2, Settings as SettingsIcon } from 'lucide-react';
import {
  LayoutDashboard,
  FilePlus2,
  ListOrdered,
  Map as MapIcon,
  ShieldAlert,
  Radio,
  Briefcase,
} from 'lucide-react';

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/submit', label: 'Submit Report', icon: FilePlus2 },
  { to: '/queue', label: 'Priority Queue', icon: ListOrdered },
  { to: '/map', label: 'Interactive Map', icon: MapIcon },
  { to: '/operations', label: 'Operations', icon: Briefcase },
];

const authLinks = [
  { to: '/login', label: 'Login', icon: LogIn },
  { to: '/register', label: 'Register', icon: UserPlus },
  { to: '/profile', label: 'Profile', icon: UserCircle2 },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(248,113,113,0.16),_transparent_24%),linear-gradient(135deg,_#f8fafc_0%,_#eef2ff_100%)] text-slate-800">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
        <header className="border-b border-slate-200/70 bg-white/80 px-3 py-4 shadow-sm backdrop-blur lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r lg:px-4 lg:py-6">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-900 px-4 py-3 text-white shadow-sm">
            <ShieldAlert className="h-7 w-7 text-rose-300" aria-hidden />
            <div>
              <h1 className="text-base font-semibold leading-tight">AI Relief</h1>
              <p className="text-xs text-slate-300">Command Center</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <Radio className="h-4 w-4 text-emerald-500" aria-hidden />
            Live feed active
          </div>

          <nav aria-label="Primary" className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {nav.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </NavLink>
            ))}
            <div className="mt-2 border-t border-slate-200 pt-2 lg:mt-4 lg:pt-3">
              {authLinks.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `mt-1 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {label}
                </NavLink>
              ))}
            </div>
          </nav>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
