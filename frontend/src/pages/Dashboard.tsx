import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  BellRing,
  Clock3,
  Flame,
  Home,
  LifeBuoy,
  RefreshCw,
  Search,
  ShieldCheck,
  Siren,
  Sparkles,
  Stethoscope,
  UtensilsCrossed,
  Waves,
  Brain,
  ArrowRight,
  Users,
  HeartPulse,
  ClipboardList,
  TimerReset,
  BadgeCheck,
  RadioTower,
  Siren as AlertSiren,
  Package,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import type { DashboardData, Report } from '../types';
import { getDashboard, runSimulation, getSimulationStatus } from '../api/reports';
import { apiErrorMessage } from '../api/mappers';
import StatCard from '../components/StatCard';
import PriorityBadge from '../components/PriorityBadge';
import { ErrorState, LoadingState, EmptyState } from '../components/StatusPill';
import ToastViewport from '../components/ToastViewport';
import { categoryConfig, formatRelativeTime, formatTimestamp, formatMetricValue } from '../lib/format';
import { useToasts } from '../hooks/useToasts';
import { useAuth } from '../hooks/useAuth';

const PIE_COLORS = ['#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0ea5e9', '#64748b'];
const PRIORITY_FILTERS = ['all', 'critical', 'high', 'medium', 'low'] as const;
const CATEGORY_FILTERS = ['all', 'medical', 'rescue', 'shelter', 'food', 'fire', 'flood', 'road', 'other'] as const;
type PriorityFilter = (typeof PRIORITY_FILTERS)[number];
type CategoryFilter = (typeof CATEGORY_FILTERS)[number];

function getCategoryIcon(category: Report['category']) {
  const config = categoryConfig[category] ?? categoryConfig.other;
  return config.icon;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<PriorityFilter>('all');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [lastUpdated, setLastUpdated] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simulationStatus, setSimulationStatus] = useState<Record<string, unknown>>({ status: 'idle', total: 0, completed: 0, progress: 0, message: 'No simulation running.' });
  const { toasts, pushToast, dismissToast } = useToasts();
  const navigate = useNavigate();
  const { role } = useAuth();
  const isAdmin = role === 'administrator';

  const loadDashboard = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setError('');
    setRefreshing(true);
    try {
      const d = await getDashboard();
      setData(d);
      setLastUpdated(new Date().toISOString());
      if (!showSpinner) pushToast('Dashboard updated', 'success');
    } catch (err) {
      setError(apiErrorMessage(err, 'dashboard'));
      pushToast('Failed to refresh dashboard', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [pushToast]);

  useEffect(() => {
    let active = true;
    void loadDashboard(true).then(() => {
      if (!active) return;
    });
    const id = window.setInterval(() => {
      void loadDashboard(false);
    }, 10000);
    const statusId = window.setInterval(() => {
      void getSimulationStatus().then(setSimulationStatus).catch(() => undefined);
    }, 1000);

    return () => {
      active = false;
      window.clearInterval(id);
      window.clearInterval(statusId);
    };
  }, [loadDashboard]);

  const filteredIncidents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (data?.recent_incidents ?? []).filter((item) => {
      const matchesPriority = selectedPriority === 'all' || item.priority === selectedPriority;
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const haystack = `${item.location} ${item.category} ${item.ai_summary ?? ''} ${item.description}`.toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      return matchesPriority && matchesCategory && matchesQuery;
    });
  }, [data?.recent_incidents, search, selectedCategory, selectedPriority]);

  const averageUrgency = useMemo(() => {
    const incidents = data?.recent_incidents ?? [];
    if (!incidents.length) return 0;
    const total = incidents.reduce((sum, item) => sum + (item.urgency_score ?? 0), 0);
    return Math.round((total / incidents.length) * 100);
  }, [data?.recent_incidents]);

  const averageConfidence = useMemo(() => {
    const incidents = data?.recent_incidents ?? [];
    if (!incidents.length) return 0;
    const total = incidents.reduce((sum, item) => sum + (item.confidence_score ?? 0), 0);
    return Math.round((total / incidents.length) * 100);
  }, [data?.recent_incidents]);

  const runDemoSimulation = async () => {
    setSimulating(true);
    try {
      const response = await runSimulation(25);
      setSimulationStatus(response);
      await loadDashboard(false);
    } catch (err) {
      pushToast(apiErrorMessage(err, 'simulation'), 'error');
    } finally {
      setSimulating(false);
    }
  };

  const barData = useMemo(() => {
    const rows = (data?.recent_incidents ?? []).slice(0, 6).map((item) => ({
      name: item.location.split(',')[0] || 'Incident',
      score: Math.round((item.urgency_score ?? 0) * 100),
      priority: item.priority,
    }));
    return rows;
  }, [data?.recent_incidents]);

  if (loading) return <LoadingState label="Loading operations board…" />;
  if (error) return <ErrorState message={error} />;
  if (!data) return <EmptyState message="No data available." />;

  return (
    <div className="space-y-6">
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />

      <section className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-700 p-6 text-white shadow-[0_30px_80px_-25px_rgba(15,23,42,0.6)] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">Emergency operations center</p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Real-time intelligence for life-saving coordination</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
              Orchestrate rescue, medical, shelter, and supply efforts from a modern command surface designed for rapid decision-making.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-medium text-cyan-200">
              <ShieldCheck className="h-4 w-4" /> AI engine active
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">{formatMetricValue(data.total_reports)}</div>
            <div className="text-sm text-slate-300">reports tracked</div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-200">
            <Activity className="h-4 w-4" /> Live system status online
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-slate-200">
            <Clock3 className="h-4 w-4" /> {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-slate-200">
            <RefreshCw className="h-4 w-4" /> Last refresh {lastUpdated ? formatRelativeTime(lastUpdated) : 'just now'}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-cyan-500/15 px-3 py-1 text-cyan-100">
            <Brain className="h-4 w-4" /> AI status online
          </span>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              void loadDashboard(false);
            }}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh now
          </button>
            {isAdmin && (
            <button type="button" onClick={() => void runDemoSimulation()} disabled={simulating} className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/15 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/25 disabled:opacity-70">
              <Sparkles className="h-4 w-4" /> {simulating ? 'Running simulation…' : 'Run Disaster Simulation (Admin)'}
            </button>
          )}
          <Link to="/submit" className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/15 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/25">
            <BellRing className="h-4 w-4" /> New incident intake
          </Link>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Incidents" value={data.total_reports} icon={Activity} description="All incoming incidents" clickable onClick={() => setSelectedCategory('all')} />
        <StatCard label="Pending Incidents" value={data.pending_incidents} icon={ClipboardList} accent="bg-amber-100 text-amber-700" description="Awaiting next action" clickable onClick={() => setSelectedPriority('high')} />
        <StatCard label="AI Reviewed" value={data.ai_reviewed} icon={Brain} accent="bg-indigo-100 text-indigo-700" description="Intelligence processed" clickable onClick={() => setSelectedCategory('all')} />
        <StatCard label="Teams Assigned" value={data.teams_assigned} icon={Users} accent="bg-sky-100 text-sky-700" description="Dispatches committed" clickable onClick={() => setSelectedCategory('all')} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Teams En Route" value={data.teams_en_route} icon={RadioTower} accent="bg-cyan-100 text-cyan-700" description="Moving to incident scenes" clickable onClick={() => setSelectedCategory('all')} />
        <StatCard label="Rescue In Progress" value={data.rescue_in_progress} icon={HeartPulse} accent="bg-rose-100 text-rose-700" description="Life-saving operations underway" clickable onClick={() => setSelectedCategory('all')} />
        <StatCard label="Successfully Resolved" value={data.successfully_resolved} icon={BadgeCheck} accent="bg-emerald-100 text-emerald-700" description="Completed missions" clickable onClick={() => setSelectedCategory('all')} />
        <StatCard label="Closed Incidents" value={data.closed_incidents} icon={AlertSiren} accent="bg-slate-100 text-slate-700" description="Mission closures" clickable onClick={() => setSelectedCategory('all')} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="People Rescued" value={data.people_rescued} icon={LifeBuoy} accent="bg-emerald-100 text-emerald-700" description="Lives moved to safety" clickable onClick={() => setSelectedCategory('all')} />
        <StatCard label="People Awaiting Rescue" value={data.people_awaiting_rescue} icon={Siren} accent="bg-orange-100 text-orange-700" description="At-risk civilians" clickable onClick={() => setSelectedCategory('all')} />
        <StatCard label="Medical Requests" value={data.medical_requests} icon={Stethoscope} accent="bg-rose-100 text-rose-700" description="Medical support demand" clickable onClick={() => setSelectedCategory('medical')} />
        <StatCard label="Fire Emergencies" value={data.fire_emergencies} icon={Flame} accent="bg-orange-100 text-orange-700" description="Fire response demand" clickable onClick={() => setSelectedCategory('fire')} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Flood Emergencies" value={data.flood_emergencies} icon={Waves} accent="bg-cyan-100 text-cyan-700" description="Water-related alerts" clickable onClick={() => setSelectedCategory('flood')} />
        <StatCard label="Average Response Time" value={`${data.average_response_time}m`} icon={TimerReset} accent="bg-violet-100 text-violet-700" description="Mean dispatch latency" clickable onClick={() => setSelectedCategory('all')} />
        <StatCard label="Average Rescue Time" value={`${data.average_rescue_time}m`} icon={Clock3} accent="bg-slate-100 text-slate-700" description="Tracks on-scene time" clickable onClick={() => setSelectedCategory('all')} />
        <StatCard label="Active Rescue Teams" value={data.active_rescue_teams} icon={Users} accent="bg-sky-100 text-sky-700" description="Operational response units" clickable onClick={() => setSelectedCategory('all')} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Available Teams" value={data.available_teams} icon={ShieldCheck} accent="bg-emerald-100 text-emerald-700" description="Ready for dispatch" clickable onClick={() => setSelectedCategory('all')} />
        <StatCard label="Busy Teams" value={data.busy_teams} icon={Activity} accent="bg-amber-100 text-amber-700" description="Currently committed" clickable onClick={() => setSelectedCategory('all')} />
        <StatCard label="Mission Success Rate" value={`${data.mission_success_rate}%`} icon={BadgeCheck} accent="bg-green-100 text-green-700" description="Completed missions" clickable onClick={() => setSelectedCategory('all')} />
        <StatCard label="Resources Used" value={data.resources_used} icon={Package} accent="bg-slate-100 text-slate-700" description="Operational stock consumed" clickable onClick={() => setSelectedCategory('all')} />
      </div>

      {isAdmin && (
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500">Live mission progress</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{String(simulationStatus.message ?? 'No simulation running.')}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold text-slate-900">{Number(simulationStatus.completed ?? 0)}/{Number(simulationStatus.total ?? 0)}</p>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">incidents processed</p>
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-cyan-600 transition-all" style={{ width: `${Math.max(0, Math.min(100, Number(simulationStatus.progress ?? 0)))}%` }} />
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="group rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <p className="text-sm font-medium text-slate-500">Average Urgency</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{data.total_reports > 0 ? `${averageUrgency}%` : '—'}</p>
          <p className="mt-1 text-xs text-slate-500">{data.total_reports > 0 ? 'Priority pressure across active incidents' : 'Submit reports to see urgency'}</p>
        </div>
        <div className="group rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <p className="text-sm font-medium text-slate-500">AI Confidence</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{data.total_reports > 0 ? `${averageConfidence}%` : '—'}</p>
          <p className="mt-1 text-xs text-slate-500">{data.total_reports > 0 ? 'Average model reliability score' : 'No AI analysis yet'}</p>
        </div>
        <div className="group rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <p className="text-sm font-medium text-slate-500">Resources Used</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{data.resources_used || 0}</p>
          <p className="mt-1 text-xs text-slate-500">{data.resources_used > 0 ? 'Operational stock consumed' : 'No resources deployed yet'}</p>
        </div>
        <div className="group rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <p className="text-sm font-medium text-slate-500">System Pulse</p>
          <div className="mt-2 flex items-center gap-2 text-lg font-semibold text-emerald-600">
            <Sparkles className="h-5 w-5" /> Online
          </div>
          <p className="mt-1 text-xs text-slate-500">Operational systems healthy</p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Operational trend</h3>
              <p className="text-sm text-slate-500">Severity pattern over the latest updates</p>
            </div>
            <div className="rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">{averageUrgency}% avg urgency</div>
          </div>
          <div className="mt-4 h-72">
            {(data.urgency_trend ?? []).length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.urgency_trend} isAnimationActive>
                  <defs>
                    {[
                      ['#dc2626', 'crit'],
                      ['#ea580c', 'high'],
                      ['#ca8a04', 'med'],
                      ['#16a34a', 'low'],
                    ].map(([color, id]) => (
                      <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="critical" stroke="#dc2626" fill="url(#crit)" />
                  <Area type="monotone" dataKey="high" stroke="#ea580c" fill="url(#high)" />
                  <Area type="monotone" dataKey="medium" stroke="#ca8a04" fill="url(#med)" />
                  <Area type="monotone" dataKey="low" stroke="#16a34a" fill="url(#low)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200">
                <Activity className="h-8 w-8 text-slate-300" />
                <p className="text-sm text-slate-400">No incident data yet.</p>
                <p className="text-xs text-slate-400">Submit reports to populate the trend chart.</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Category mix</h3>
                <p className="text-sm text-slate-500">High-level demand distribution</p>
              </div>
            </div>
            <div className="mt-4 h-56">
              {(data.category_distribution ?? []).length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.category_distribution} dataKey="value" nameKey="name" innerRadius={46} outerRadius={78} paddingAngle={2} isAnimationActive>
                      {data.category_distribution.map((_, i) => (
                        <Cell key={`${_.name}-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-sm text-slate-400">No category data yet.</p>
                  <p className="text-xs text-slate-400">Submit reports to see distribution.</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Priority pulse</h3>
                <p className="text-sm text-slate-500">Active severity by priority</p>
              </div>
            </div>
            <div className="mt-4 h-56">
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} isAnimationActive>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <Tooltip />
                    <Bar dataKey="score" radius={[8, 8, 0, 0]} fill="#0f172a" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-sm text-slate-400">No urgency data yet.</p>
                  <p className="text-xs text-slate-400">Submit reports to populate this chart.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white/90 shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Live activity feed</h3>
                <p className="text-sm text-slate-500">Mission updates from the current response cycle</p>
              </div>
            </div>
          </div>
          <div className="max-h-80 space-y-2 overflow-y-auto px-5 py-4">
            {(data.activity_feed ?? []).length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">No activity yet. Dispatch teams to see updates here.</p>
            ) : (data.activity_feed ?? []).map((item, index) => (
              <div key={`${item.timestamp}-${index}`} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                <div className="mt-0.5 rounded-full bg-cyan-600 p-1.5 text-white">
                  <Activity className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{String(item.timestamp ?? '')}</div>
                  <div className="text-sm text-slate-600">{String(item.message ?? '')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-white/90 shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Notifications</h3>
              <p className="text-sm text-slate-500">Rescue team dispatch updates</p>
            </div>
          </div>
          <div className="max-h-80 space-y-2 overflow-y-auto px-5 py-4">
            {(data.notifications ?? []).map((item) => (
              <div key={item.id as string | number} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
                <div className="font-semibold text-slate-900">{String(item.assigned_team ?? 'Team')}</div>
                <div className="mt-1">{String(item.incident_location ?? 'Incident')} · {String(item.priority ?? 'Priority')}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">{String(item.status ?? 'sent')}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white/90 shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">AI insights</h3>
              <p className="text-sm text-slate-500">Operational recommendations generated from the current incident load</p>
            </div>
            <Link to="/operations" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-2 text-sm font-medium text-white transition-all hover:bg-slate-800 active:scale-95">
              Open operations <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {data.total_reports > 0 ? (
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 transition-all duration-200 hover:border-slate-300 hover:shadow-sm">
                <div className="text-sm font-semibold text-slate-900">Priority focus</div>
                <div className="mt-1 text-sm text-slate-600">
                  {data.critical_incidents > 0 ? `${data.critical_incidents} critical incident${data.critical_incidents > 1 ? 's' : ''} need immediate attention.` : 'No critical incidents at this time.'}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 transition-all duration-200 hover:border-slate-300 hover:shadow-sm">
                <div className="text-sm font-semibold text-slate-900">Team readiness</div>
                <div className="mt-1 text-sm text-slate-600">
                  {data.available_teams > 0 ? `${data.available_teams} team${data.available_teams > 1 ? 's' : ''} ready for dispatch.` : 'All teams are currently assigned.'}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 transition-all duration-200 hover:border-slate-300 hover:shadow-sm">
                <div className="text-sm font-semibold text-slate-900">Incident load</div>
                <div className="mt-1 text-sm text-slate-600">
                  {data.pending_incidents > 0 ? `${data.pending_incidents} incident${data.pending_incidents > 1 ? 's' : ''} pending review.` : 'All incidents have been reviewed.'}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-3 rounded-2xl border border-dashed border-slate-200 py-6 text-center">
              <Brain className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm text-slate-400">No incident data yet.</p>
              <p className="text-xs text-slate-400">Submit reports to generate AI insights.</p>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Live incident table</h3>
            <p className="text-sm text-slate-500">Search, filter, and drill into the most urgent cases</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                aria-label="Search incidents"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search incident"
                className="w-36 bg-transparent text-sm outline-none"
              />
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <AlertTriangle className="h-4 w-4 text-slate-400" />
              <select
                aria-label="Filter by category"
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value as CategoryFilter)}
                className="bg-transparent text-sm outline-none"
              >
                {CATEGORY_FILTERS.map((option) => (
                  <option key={option} value={option}>
                    {option === 'all' ? 'All categories' : option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <ShieldCheck className="h-4 w-4 text-slate-400" />
              <select
                aria-label="Filter by priority"
                value={selectedPriority}
                onChange={(event) => setSelectedPriority(event.target.value as PriorityFilter)}
                className="bg-transparent text-sm outline-none"
              >
                {PRIORITY_FILTERS.map((option) => (
                  <option key={option} value={option}>
                    {option === 'all' ? 'All priority' : option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </label>
            <Link to="/queue" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              View full queue →
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Incident</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Priority</th>
                <th className="px-5 py-3 font-medium">Urgency</th>
                <th className="px-5 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredIncidents.length ? (
                filteredIncidents.map((report) => {
                  const CategoryIcon = getCategoryIcon(report.category);
                  return (
                    <tr key={report.id} className="cursor-pointer transition hover:bg-slate-50" onClick={() => navigate(`/incident/${report.id}`)}>
                      <td className="px-5 py-3">
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl ${categoryConfig[report.category]?.accent ?? categoryConfig.other.accent}`}>
                            <CategoryIcon className="h-4 w-4" aria-hidden />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{report.location}</div>
                            <div className="mt-1 text-xs text-slate-500">{report.description}</div>
                            {report.latitude != null && report.longitude != null ? (
                              <div className="mt-1 text-[11px] text-slate-400">{report.latitude.toFixed(2)}, {report.longitude.toFixed(2)}</div>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-700">
                          {report.category}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <PriorityBadge priority={report.priority} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full" style={{ width: `${Math.round((report.urgency_score ?? 0) * 100)}%`, backgroundColor: '#0f172a' }} />
                          </div>
                          <span className="text-sm font-semibold text-slate-700">{Math.round((report.urgency_score ?? 0) * 100)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        <div>{formatTimestamp(report.timestamp)}</div>
                        <div className="text-xs text-slate-400">{formatRelativeTime(report.timestamp)}</div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5}>
                    <EmptyState message="No incidents match the current filters." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
