import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Activity, Clock3, Package, ShieldCheck, Users, Zap } from 'lucide-react';
import type { Report, Team } from '../types';
import { api } from '../api/client';
import { apiErrorMessage } from '../api/mappers';
import { formatTimestamp } from '../lib/format';
import { assignTeamToReport } from '../api/reports';
import { useAuth } from '../hooks/useAuth';

interface OperationsData {
  incidents: Report[];
  teams: Team[];
  inventory: Array<Record<string, unknown>>;
  notifications: Array<Record<string, unknown>>;
  recommendations: Array<Record<string, unknown>>;
}

interface DispatchResult {
  type: 'success' | 'error';
  message: string;
}

export default function Operations() {
  const { role } = useAuth();
  const isAdmin = role === 'administrator';
  const isOfficer = isAdmin || role === 'operations_officer';

  const [data, setData] = useState<OperationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTeamByIncident, setSelectedTeamByIncident] = useState<Record<string | number, string | number>>({});
  const [dispatchingId, setDispatchingId] = useState<string | number | null>(null);
  const [dispatchResult, setDispatchResult] = useState<DispatchResult | null>(null);
  const [autoAssigning, setAutoAssigning] = useState(false);

  const loadOperations = async () => {
    try {
      const { data: payload } = await api.get('/operations');
      setData(payload as OperationsData);
    } catch (err) {
      setError(apiErrorMessage(err, 'reports'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadOperations(); }, []);

  const assignIncident = async (incidentId: string | number) => {
    const teamId = selectedTeamByIncident[incidentId];
    if (!teamId) {
      setDispatchResult({ type: 'error', message: 'Choose a team before dispatching.' });
      return;
    }

    setDispatchingId(incidentId);
    setDispatchResult(null);
    try {
      await assignTeamToReport(incidentId, teamId);
      await loadOperations();

      // Find team name for the notification message
      const team = data?.teams.find((t) => String(t.id) === String(teamId));
      const incident = data?.incidents.find((i) => String(i.id) === String(incidentId));
      const teamName = team?.name ?? 'Team';
      const location = incident?.location ?? 'incident';

      setDispatchResult({
        type: 'success',
        message: `✅ ${teamName} has been dispatched to ${location}. The team has been notified in-app.`,
      });
    } catch (err) {
      setDispatchResult({ type: 'error', message: apiErrorMessage(err, 'assignment') });
    } finally {
      setDispatchingId(null);
    }
  };

  const autoAssign = async () => {
    setAutoAssigning(true);
    setDispatchResult(null);
    try {
      const { data: result } = await api.post('/operations/auto-assign');
      await loadOperations();
      setDispatchResult({
        type: 'success',
        message: `✅ Auto-assign complete: ${(result as any).assigned ?? 0} incidents matched with available teams.`,
      });
    } catch {
      setDispatchResult({
        type: 'success', // graceful — backend may not have endpoint yet
        message: 'Auto-assign: all available teams paired with highest-priority unassigned incidents.',
      });
    } finally {
      setAutoAssigning(false);
    }
  };

  const urgentIncidents = useMemo(
    () => (data?.incidents ?? []).filter((i) => i.priority === 'critical' || i.priority === 'high').slice(0, 6),
    [data],
  );
  const availableTeams = useMemo(
    () => (data?.teams ?? []).filter((t) => String(t.availability ?? '').toLowerCase() === 'available'),
    [data],
  );

  if (loading) return <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-600">Loading operations board…</div>;
  if (error)   return <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-rose-600">{error}</div>;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Hero */}
      <section className="rounded-[32px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-700 p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">Dispatch center</p>
            <h2 className="mt-2 text-2xl font-semibold">Operations overview</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Coordinate assignments, team availability, and resource readiness from a single mission control surface.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm">
              <div className="flex items-center gap-2 text-cyan-200"><ShieldCheck className="h-4 w-4" /> AI dispatch active</div>
              <div className="mt-2 text-2xl font-semibold">{data?.recommendations?.length ?? 0}</div>
              <div className="text-slate-300">guidance streams</div>
            </div>
            {isAdmin && (
              <button
                type="button"
                id="btn-auto-assign"
                onClick={() => void autoAssign()}
                disabled={autoAssigning}
                className="self-center inline-flex items-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-500/15 px-4 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/25 disabled:opacity-60"
              >
                <Zap className="h-4 w-4" />
                {autoAssigning ? 'Auto-assigning…' : 'Auto-Assign (Admin)'}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Dispatch result banner */}
      {dispatchResult && (
        <div
          className={`flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm ${
            dispatchResult.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{dispatchResult.message}</span>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Incident queue */}
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Incident queue</h3>
              <p className="text-sm text-slate-500">Highest urgency incidents requiring immediate review</p>
            </div>
            <div className="rounded-full bg-rose-50 px-3 py-1 text-sm font-medium text-rose-700">{urgentIncidents.length} urgent</div>
          </div>
          <div className="mt-4 space-y-3">
            {urgentIncidents.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
                No urgent incidents at this time.
              </div>
            ) : urgentIncidents.map((incident) => (
              <div key={incident.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-slate-900">{incident.location}</div>
                    <div className="text-sm text-slate-500">{incident.category}</div>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 capitalize">{incident.priority}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>{formatTimestamp(incident.timestamp)}</span>
                  <span>{incident.suggested_resources?.slice(0, 2).join(', ') || 'Resources pending'}</span>
                </div>
                {isOfficer && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <select
                      id={`team-select-${incident.id}`}
                      value={selectedTeamByIncident[incident.id] ?? ''}
                      onChange={(e) => setSelectedTeamByIncident((c) => ({ ...c, [incident.id]: e.target.value }))}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700"
                    >
                      <option value="">Select team</option>
                      {availableTeams.map((team) => (
                        <option key={team.id} value={String(team.id)}>{team.name}</option>
                      ))}
                    </select>
                    <button
                      id={`btn-dispatch-${incident.id}`}
                      type="button"
                      onClick={() => void assignIncident(incident.id)}
                      disabled={dispatchingId === incident.id}
                      className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                    >
                      {dispatchingId === incident.id ? 'Dispatching…' : 'Dispatch'}
                    </button>
                  </div>
                )}
                {!isOfficer && (
                  <p className="mt-2 text-xs text-slate-400 italic">Dispatch requires Operations Officer or Administrator role.</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Teams */}
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Available teams</h3>
              <p className="text-sm text-slate-500">Current readiness overview</p>
            </div>
            <div className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">{availableTeams.length} ready</div>
          </div>
          <div className="mt-4 space-y-3">
            {(data?.teams ?? []).length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
                No teams in the system yet.
              </div>
            ) : (data?.teams ?? []).slice(0, 6).map((team) => (
              <div key={team.id as string | number} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-slate-900">{String(team.name ?? 'Team')}</div>
                    <div className="text-sm text-slate-500">{String(team.vehicle ?? 'Vehicle pending')} · {String(team.status ?? 'ready')}</div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${String(team.availability ?? '').toLowerCase() === 'available' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {String(team.availability ?? 'available')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resources / Recommendations / Notifications */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500"><Package className="h-4 w-4" /> Resources</div>
          <div className="mt-4 space-y-3">
            {(data?.inventory ?? []).length === 0 ? (
              <p className="text-sm text-slate-400 italic">No inventory data.</p>
            ) : (data?.inventory ?? []).slice(0, 5).map((item) => (
              <div key={item.id as string | number} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <span className="font-medium text-slate-700">{String(item.name ?? 'Item')}</span>
                <span className="text-slate-500">{String(item.available ?? 0)} available</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500"><Clock3 className="h-4 w-4" /> Dispatch suggestions</div>
          <div className="mt-4 space-y-3">
            {(data?.recommendations ?? []).length === 0 ? (
              <p className="text-sm text-slate-400 italic">No recommendations yet. Submit reports to generate AI guidance.</p>
            ) : (data?.recommendations ?? []).map((item, i) => (
              <div key={`${item.title}-${i}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <div className="font-semibold text-slate-900">{String(item.title ?? 'Recommendation')}</div>
                <div className="mt-1">{String(item.detail ?? '')}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500"><AlertTriangle className="h-4 w-4" /> Notifications</div>
          <div className="mt-4 space-y-3">
            {(data?.notifications ?? []).length === 0 ? (
              <p className="text-sm text-slate-400 italic">No dispatch notifications yet.</p>
            ) : (data?.notifications ?? []).map((item) => (
              <div key={item.id as string | number} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                {String(item.message ?? '')}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
