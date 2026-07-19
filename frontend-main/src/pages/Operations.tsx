import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Ambulance, Activity, ArrowRight, Clock3, Package, ShieldCheck, Users } from 'lucide-react';
import type { Report, Team } from '../types';
import { api } from '../api/client';
import { apiErrorMessage } from '../api/mappers';
import { formatTimestamp } from '../lib/format';
import { assignTeamToReport } from '../api/reports';

interface OperationsData {
  incidents: Report[];
  teams: Team[];
  inventory: Array<Record<string, unknown>>;
  notifications: Array<Record<string, unknown>>;
  recommendations: Array<Record<string, unknown>>;
}

export default function Operations() {
  const [data, setData] = useState<OperationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTeamByIncident, setSelectedTeamByIncident] = useState<Record<string | number, string | number>>({});
  const [dispatchingId, setDispatchingId] = useState<string | number | null>(null);
  const [dispatchMessage, setDispatchMessage] = useState('');

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

  useEffect(() => {
    void loadOperations();
  }, []);

  const assignIncident = async (incidentId: string | number) => {
    const teamId = selectedTeamByIncident[incidentId];
    if (!teamId) {
      setDispatchMessage('Choose a team before dispatching.');
      return;
    }

    setDispatchingId(incidentId);
    setDispatchMessage('');
    try {
      await assignTeamToReport(incidentId, teamId);
      await loadOperations();
      setDispatchMessage('Dispatch request sent successfully.');
    } catch (err) {
      setDispatchMessage(apiErrorMessage(err, 'assignment'));
    } finally {
      setDispatchingId(null);
    }
  };

  const urgentIncidents = useMemo(() => (data?.incidents ?? []).filter((item) => item.priority === 'critical' || item.priority === 'high').slice(0, 4), [data]);
  const availableTeams = useMemo(() => (data?.teams ?? []).filter((team) => String(team.availability ?? '').toLowerCase() === 'available'), [data]);

  if (loading) return <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-600">Loading operations board…</div>;
  if (error) return <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-rose-600">{error}</div>;

  return (
    <div className="space-y-4">
      <section className="rounded-[32px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-700 p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">Dispatch center</p>
            <h2 className="mt-2 text-2xl font-semibold">Operations overview</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">Coordinate assignments, team availability, and resource readiness from a single mission control surface.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm">
            <div className="flex items-center gap-2 text-cyan-200"><ShieldCheck className="h-4 w-4" /> AI dispatch recommendations active</div>
            <div className="mt-2 text-2xl font-semibold">{data?.recommendations?.length ?? 0}</div>
            <div className="text-slate-300">active guidance streams</div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Incident queue</h3>
              <p className="text-sm text-slate-500">Highest urgency incidents requiring immediate review</p>
            </div>
            <div className="rounded-full bg-rose-50 px-3 py-1 text-sm font-medium text-rose-700">{urgentIncidents.length} urgent</div>
          </div>
          <div className="mt-4 space-y-3">
            {dispatchMessage ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{dispatchMessage}</div> : null}
            {urgentIncidents.map((incident) => (
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
                  <span>{incident.suggested_resources?.slice(0,2).join(', ') || 'Resources pending'}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <select
                    value={selectedTeamByIncident[incident.id] ?? ''}
                    onChange={(event) => setSelectedTeamByIncident((current) => ({ ...current, [incident.id]: event.target.value }))}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700"
                  >
                    <option value="">Select team</option>
                    {availableTeams.map((team) => (
                      <option key={team.id} value={String(team.id)}>{team.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => void assignIncident(incident.id)}
                    disabled={dispatchingId === incident.id}
                    className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                  >
                    {dispatchingId === incident.id ? 'Dispatching…' : 'Dispatch'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Available teams</h3>
              <p className="text-sm text-slate-500">Current readiness overview</p>
            </div>
            <div className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">{(data?.teams ?? []).filter((team) => String(team.availability ?? '').toLowerCase() === 'available').length} ready</div>
          </div>
          <div className="mt-4 space-y-3">
            {(data?.teams ?? []).slice(0, 4).map((team) => (
              <div key={team.id as string | number} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-slate-900">{String(team.name ?? 'Team')}</div>
                    <div className="text-sm text-slate-500">{String(team.vehicle ?? 'Vehicle pending')} · {String(team.status ?? 'ready')}</div>
                  </div>
                  <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700">{String(team.availability ?? 'available')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500"><Package className="h-4 w-4" /> Resources</div>
          <div className="mt-4 space-y-3">
            {(data?.inventory ?? []).slice(0, 4).map((item) => (
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
            {(data?.recommendations ?? []).map((item, index) => (
              <div key={`${item.title}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <div className="font-semibold text-slate-900">{String(item.title ?? 'Recommendation')}</div>
                <div className="mt-1">{String(item.detail ?? '')}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500"><AlertTriangle className="h-4 w-4" /> Notifications</div>
          <div className="mt-4 space-y-3">
            {(data?.notifications ?? []).map((item) => (
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
