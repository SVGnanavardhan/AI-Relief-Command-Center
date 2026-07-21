import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { supabase } from '../lib/format';
import { ShieldAlert, Activity, Brain, Users, Siren, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

type Tab = 'signin' | 'signup';

const FEATURES = [
  { icon: Brain, label: 'AI-Powered Triage', desc: 'Automatic incident prioritization using Gemini AI' },
  { icon: Activity, label: 'Real-time Dashboard', desc: 'Live updates on all active rescue operations' },
  { icon: Users, label: 'Team Coordination', desc: 'Dispatch and track rescue teams in real-time' },
  { icon: Siren, label: 'Multi-hazard Response', desc: 'Medical, fire, flood, rescue and more' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('signin');

  // Sign In
  const [siEmail, setSiEmail] = useState('');
  const [siPassword, setSiPassword] = useState('');
  const [siError, setSiError] = useState('');
  const [siLoading, setSiLoading] = useState(false);
  const [showSiPw, setShowSiPw] = useState(false);

  // Sign Up
  const [suName, setSuName] = useState('');
  const [suEmail, setSuEmail] = useState('');
  const [suPassword, setSuPassword] = useState('');
  const [suRole, setSuRole] = useState('citizen');
  const [suError, setSuError] = useState('');
  const [suSuccess, setSuSuccess] = useState('');
  const [suLoading, setSuLoading] = useState(false);
  const [showSuPw, setShowSuPw] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate('/dashboard');
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate('/dashboard');
    });
    return () => listener.subscription.unsubscribe();
  }, [navigate]);

  async function handleSignIn(e: FormEvent) {
    e.preventDefault();
    setSiError('');
    setSiLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: siEmail.trim(), password: siPassword });
      if (error) throw new Error(error.message);
      if (!data.session?.access_token) throw new Error('No session returned. Please try again.');
      const response = await api.post('/auth/login', { access_token: data.session.access_token });
      localStorage.setItem('access_token', data.session.access_token);
      localStorage.setItem('refresh_token', data.session.refresh_token ?? '');
      localStorage.setItem('auth_user', JSON.stringify(response.data.user));
      navigate('/dashboard');
    } catch (err: any) {
      setSiError(err?.message || err?.response?.data?.detail || 'Unable to sign in');
    } finally {
      setSiLoading(false);
    }
  }

  async function handleSignUp(e: FormEvent) {
    e.preventDefault();
    setSuError('');
    setSuSuccess('');
    setSuLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: suEmail.trim(),
        password: suPassword,
        options: { data: { full_name: suName.trim(), role: suRole } },
      });
      if (error) {
        const msg = error.message?.toLowerCase() ?? '';
        if (msg.includes('already')) {
          setSuError('An account with this email already exists.');
          setActiveTab('signin');
          setSiEmail(suEmail);
          return;
        }
        throw new Error(error.message);
      }
      if (data.session?.access_token) {
        const response = await api.post('/auth/register', {
          access_token: data.session.access_token,
          name: suName.trim(),
          email: suEmail.trim(),
          role: suRole,
        });
        localStorage.setItem('access_token', data.session.access_token);
        localStorage.setItem('refresh_token', data.session.refresh_token ?? '');
        localStorage.setItem('auth_user', JSON.stringify(response.data.user));
        navigate('/dashboard');
      } else {
        setSuSuccess('Account created! You can now sign in.');
        setActiveTab('signin');
        setSiEmail(suEmail.trim());
      }
    } catch (err: any) {
      setSuError(err?.message || err?.response?.data?.detail || 'Unable to register');
    } finally {
      setSuLoading(false);
    }
  }

  const inputCls =
    'w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20';

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Animated background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-blob absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="animate-blob animation-delay-2000 absolute top-1/2 -right-40 h-[500px] w-[500px] rounded-full bg-cyan-600/15 blur-[100px]" />
        <div className="animate-blob animation-delay-4000 absolute -bottom-40 left-1/3 h-[400px] w-[400px] rounded-full bg-rose-600/10 blur-[80px]" />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='g' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='rgba(255,255,255,0.03)' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3C/svg%3E\")",
          }}
        />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">
        {/* ── Left panel ── */}
        <div className="flex flex-col justify-between p-8 lg:w-[55%] lg:p-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 ring-1 ring-rose-500/30">
              <ShieldAlert className="h-5 w-5 text-rose-400" />
            </div>
            <div>
              <span className="text-lg font-bold text-white">AI Relief</span>
              <span className="ml-1.5 text-sm font-normal text-slate-400">Command Center</span>
            </div>
          </div>

          {/* Hero */}
          <div className="mt-16 lg:mt-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              System online · All services operational
            </div>

            <h1 className="mt-6 text-4xl font-bold leading-tight text-white lg:text-5xl xl:text-6xl">
              Coordinate disaster
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                relief operations
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-400">
              AI-powered command center for real-time emergency coordination. Triage incidents, dispatch teams, and save lives faster.
            </p>

            {/* Feature cards */}
            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {FEATURES.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15">
                    <Icon className="h-4 w-4 text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{label}</div>
                    <div className="mt-0.5 text-xs text-slate-400">{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="mt-10 flex flex-wrap gap-8 border-t border-white/5 pt-8">
              {[
                { value: 'Real-time', label: 'Incident tracking' },
                { value: 'AI', label: 'Priority scoring' },
                { value: '24/7', label: 'Command center' },
              ].map(({ value, label }) => (
                <div key={label}>
                  <div className="text-2xl font-bold text-white">{value}</div>
                  <div className="text-sm text-slate-400">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-8 text-xs text-slate-600">© 2025 AI Relief Command Center · Emergency Response Platform</p>
        </div>

        {/* ── Right panel – Auth card ── */}
        <div className="flex items-center justify-center p-6 lg:w-[45%] lg:p-16">
          <div className="w-full max-w-md animate-fade-in">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
              {/* Tab switcher */}
              <div className="flex gap-1 rounded-2xl bg-black/30 p-1">
                {(['signin', 'signup'] as Tab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    id={`tab-${tab}`}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all ${
                      activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab === 'signin' ? 'Sign In' : 'Sign Up'}
                  </button>
                ))}
              </div>

              {/* ── Sign In ── */}
              {activeTab === 'signin' && (
                <form id="form-signin" onSubmit={handleSignIn} className="mt-6 flex flex-col gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">Welcome back</p>
                    <h2 className="mt-1 text-xl font-bold text-white">Sign in to command center</h2>
                  </div>
                  {siError && (
                    <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300">
                      <AlertCircle className="h-4 w-4 shrink-0" /> {siError}
                    </div>
                  )}
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-slate-400">Email address</label>
                      <input id="si-email" type="email" required value={siEmail} onChange={(e) => setSiEmail(e.target.value)} placeholder="you@example.com" className={inputCls} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-slate-400">Password</label>
                      <div className="relative">
                        <input id="si-password" type={showSiPw ? 'text' : 'password'} required value={siPassword} onChange={(e) => setSiPassword(e.target.value)} placeholder="••••••••" className={`${inputCls} pr-10`} />
                        <button type="button" onClick={() => setShowSiPw(!showSiPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300">
                          {showSiPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    id="btn-signin"
                    type="submit"
                    disabled={siLoading}
                    className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-cyan-400 hover:to-indigo-400 disabled:opacity-60"
                  >
                    {siLoading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Signing in…</> : 'Sign in to command center'}
                  </button>
                  <p className="text-center text-sm text-slate-500">
                    New to the platform?{' '}
                    <button type="button" onClick={() => setActiveTab('signup')} className="text-cyan-400 hover:text-cyan-300">Create an account</button>
                  </p>
                </form>
              )}

              {/* ── Sign Up ── */}
              {activeTab === 'signup' && (
                <form id="form-signup" onSubmit={handleSignUp} className="mt-6 flex flex-col gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">Join the network</p>
                    <h2 className="mt-1 text-xl font-bold text-white">Create your account</h2>
                  </div>
                  {suError && (
                    <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300">
                      <AlertCircle className="h-4 w-4 shrink-0" /> {suError}
                    </div>
                  )}
                  {suSuccess && (
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-300">
                      <CheckCircle className="h-4 w-4 shrink-0" /> {suSuccess}
                    </div>
                  )}
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-slate-400">Full name</label>
                      <input id="su-name" type="text" required value={suName} onChange={(e) => setSuName(e.target.value)} placeholder="Your full name" className={inputCls} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-slate-400">Email address</label>
                      <input id="su-email" type="email" required value={suEmail} onChange={(e) => setSuEmail(e.target.value)} placeholder="you@example.com" className={inputCls} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-slate-400">Password</label>
                      <div className="relative">
                        <input id="su-password" type={showSuPw ? 'text' : 'password'} required value={suPassword} onChange={(e) => setSuPassword(e.target.value)} placeholder="Min. 8 characters" className={`${inputCls} pr-10`} />
                        <button type="button" onClick={() => setShowSuPw(!showSuPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300">
                          {showSuPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-slate-400">Your role</label>
                      <select id="su-role" value={suRole} onChange={(e) => setSuRole(e.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-800 px-3.5 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20">
                        <option value="citizen">Citizen / Volunteer</option>
                        <option value="rescue_team">Rescue Team Member</option>
                        <option value="operations_officer">Operations Officer</option>
                        <option value="administrator">Administrator</option>
                      </select>
                    </div>
                  </div>
                  <button
                    id="btn-signup"
                    type="submit"
                    disabled={suLoading}
                    className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-cyan-400 hover:to-indigo-400 disabled:opacity-60"
                  >
                    {suLoading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Creating account…</> : 'Join the response network'}
                  </button>
                  <p className="text-center text-sm text-slate-500">
                    Already have an account?{' '}
                    <button type="button" onClick={() => setActiveTab('signin')} className="text-cyan-400 hover:text-cyan-300">Sign in</button>
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
