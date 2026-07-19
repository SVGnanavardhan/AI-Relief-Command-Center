import { useEffect, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  FileText,
  Tag,
  Gauge,
  Siren,
  Package,
  MapPin,
  Brain,
  Crosshair,
  Volume2,
  ShieldCheck,
  Copy,
  RefreshCw,
  Download,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Building2,
  Home,
  BadgeAlert,
  Cpu,
  Route,
  Waves,
  Users,
  Car,
} from 'lucide-react';
import type { Report } from '../types';
import { getReport, getTeams, assignTeamToReport, updateIncidentStatus } from '../api/reports';
import { api } from '../api/client';
import { apiErrorMessage } from '../api/mappers';
import { formatTimestamp, priorityConfig } from '../lib/format';
import PriorityBadge from '../components/PriorityBadge';
import ResourceBadges from '../components/ResourceBadges';
import { ErrorState, LoadingState } from '../components/StatusPill';

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof ShieldCheck;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="h-4 w-4" aria-hidden />
        <h3 className="text-sm font-medium">{label}</h3>
      </div>
      <div className="mt-2 text-slate-900">{children}</div>
    </div>
  );
}

export default function IncidentDetails() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [history, setHistory] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('verified');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [teams, setTeams] = useState<Array<Record<string, unknown>>>([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [assigningTeam, setAssigningTeam] = useState(false);

  const loadIncident = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [data, teamsData] = await Promise.all([getReport(id), getTeams()]);
      setReport(data);
      setTeams(teamsData);
      if (teamsData.length && !selectedTeamId) {
        setSelectedTeamId(String(teamsData[0].id));
      }
      const { data: historyData } = await api.get(`/reports/${id}/history`);
      setHistory(historyData as Array<Record<string, unknown>>);
    } catch (err) {
      setError(apiErrorMessage(err, 'incident'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    void loadIncident().then(() => {
      if (!active) return;
    });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <LoadingState label="Loading incident…" />;
  if (error) return <ErrorState message={error} />;
  if (!report) return <ErrorState message="Incident not found." />;

  const cfg = priorityConfig[report.priority];
  const score = Math.round((report.urgency_score ?? 0) * 100);

  const copyCoordinates = async () => {
    if (report.latitude == null || report.longitude == null) return;
    await navigator.clipboard.writeText(`${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`);
  };

  const saveStatus = async () => {
    if (!id || !report) return;
    setSaving(true);
    try {
      const data = await updateIncidentStatus(id, selectedStatus, note);
      setReport((current) => current ? { ...current, status: data.status } : current);
      const { data: historyData } = await api.get(`/reports/${id}/history`);
      setHistory(historyData as Array<Record<string, unknown>>);
      setNote('');
    } catch (err) {
      setError(apiErrorMessage(err, 'incident'));
    } finally {
      setSaving(false);
    }
  };

  const assignTeam = async () => {
    if (!id || !selectedTeamId || !report) return;
    setAssigningTeam(true);
    try {
      const data = await assignTeamToReport(id, selectedTeamId);
      setReport((current) => current ? { ...current, status: data.status, assigned_team: data.assigned_team, assigned_team_id: data.assigned_team_id } : current);
      setError('');
    } catch (err) {
      setError(apiErrorMessage(err, 'assignment'));
    } finally {
      setAssigningTeam(false);
    }
  };

  const exportPdf = () => {
    const content = `Incident Report\n\nLocation: ${report.location}\nPriority: ${report.priority}\nSummary: ${report.ai_summary || report.description}\nResources: ${report.suggested_resources.join(', ')}`;
    const blob = new Blob([content], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `incident-${report.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <Link to="/queue" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back to queue
      </Link>

      <div className="mb-6 rounded-[32px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-700 p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-slate-300">Incident overview</p>
            <h2 className="mt-2 text-2xl font-bold">{report.location}</h2>
            <p className="mt-2 flex items-center gap-1 text-sm text-slate-300">
              <MapPin className="h-4 w-4" /> {report.category}
            </p>
          </div>
          <PriorityBadge priority={report.priority} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-white/10 px-3 py-1 text-slate-100">{report.status || 'New'}</span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-slate-100">{formatTimestamp(report.timestamp)}</span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-slate-100">Score {score}</span>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={() => window.location.reload()} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button type="button" onClick={copyCoordinates} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20">
            <Copy className="h-4 w-4" /> Copy coordinates
          </button>
          <button type="button" onClick={exportPdf} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20">
            <Download className="h-4 w-4" /> Download report
          </button>
          <a href={`https://www.google.com/maps/search/?api=1&query=${report.latitude ?? 0},${report.longitude ?? 0}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20">
            <ExternalLink className="h-4 w-4" /> Open Google Maps
          </a>
        </div>
      </div>

      <div className="mb-4 grid gap-4 md:grid-cols-2">
        <Field icon={CheckCircle2} label="Lifecycle controls">
          <div className="space-y-3">
            <label className="block text-sm text-slate-600">
              <span className="mb-1 block font-medium">Update status</span>
              <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none">
                {['new','verified','assigned','team en route','on scene','rescue in progress','resolved','closed'].map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-slate-600">
              <span className="mb-1 block font-medium">Operations note</span>
              <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none" placeholder="Add mission update" />
            </label>
            <label className="block text-sm text-slate-600">
              <span className="mb-1 block font-medium">Assign team</span>
              <div className="flex flex-wrap gap-2">
                <select value={selectedTeamId} onChange={(event) => setSelectedTeamId(event.target.value)} className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none">
                  {teams.length ? teams.map((team) => (
                    <option key={String(team.id)} value={String(team.id)}>{String(team.name ?? 'Team')}</option>
                  )) : <option value="">No teams available</option>}
                </select>
                <button type="button" onClick={() => void assignTeam()} disabled={assigningTeam || !selectedTeamId} className="rounded-full bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60">
                  {assigningTeam ? 'Assigning…' : 'Assign team'}
                </button>
              </div>
              {report.assigned_team ? <p className="mt-2 text-xs text-slate-500">Current assignment: {report.assigned_team}</p> : null}
            </label>
            <button type="button" onClick={() => void saveStatus()} disabled={saving} className="rounded-full bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60">
              {saving ? 'Saving…' : 'Save lifecycle update'}
            </button>
          </div>
        </Field>
        <Field icon={FileText} label="AI Summary">
          <p className="text-sm leading-relaxed">{report.ai_summary || 'No AI summary available yet.'}</p>
        </Field>

        <Field icon={Tag} label="Category">
          <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-sm font-medium capitalize text-slate-700">
            {report.category}
          </span>
        </Field>

        <Field icon={Gauge} label="Urgency Score">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-semibold tabular-nums">{score}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: cfg.color }} />
            </div>
          </div>
        </Field>

        <Field icon={Siren} label="Priority">
          <span className="font-semibold" style={{ color: cfg.color }}>
            {cfg.label}
          </span>
        </Field>

        <Field icon={Package} label="Suggested Resources">
          <ResourceBadges resources={report.suggested_resources} />
        </Field>

        <Field icon={Clock} label="Timestamp">
          <p className="text-sm">{formatTimestamp(report.timestamp)}</p>
        </Field>

        <Field icon={Brain} label="AI Reasoning">
          <p className="text-sm leading-relaxed">{report.reasoning || 'No reasoning available.'}</p>
        </Field>

        <Field icon={Crosshair} label="Coordinates">
          <p className="text-sm tabular-nums text-slate-700">
            {report.latitude != null && report.longitude != null
              ? `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`
              : 'Not provided'}
          </p>
        </Field>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <ShieldCheck className="h-4 w-4" aria-hidden />
            <h3 className="text-sm font-medium">Operational timeline</h3>
          </div>
          <div className="mt-4 space-y-3">
            {[
              ['Report Submitted', formatTimestamp(report.timestamp)],
              ['AI Completed', report.ai_summary ? 'AI summary generated successfully' : 'Pending analysis'],
              ['Resources Suggested', report.suggested_resources.join(', ') || 'Pending review'],
              ['Current Status', report.status || 'Reported'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</div>
                <div className="mt-1 text-sm text-slate-800">{value}</div>
              </div>
            ))}
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status history</div>
              <div className="mt-2 space-y-2">
                {history.length ? history.map((item) => (
                  <div key={String(item.id)} className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-700">
                    <div className="font-medium capitalize">{String(item.status ?? '')}</div>
                    {item.note ? <div className="mt-1 text-xs text-slate-500">{String(item.note)}</div> : null}
                    <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-slate-400">{item.created_at ? String(item.created_at) : ''}</div>
                  </div>
                )) : <div className="text-sm text-slate-500">No history yet.</div>}
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <Sparkles className="h-4 w-4" aria-hidden />
            <h3 className="text-sm font-medium">Evidence & media</h3>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-800">{report.description}</p>
          {report.image_url && (
            <img src={report.image_url} alt="Report attachment" className="mt-3 max-h-72 w-full rounded-lg border border-slate-200 object-cover" />
          )}
          {report.voice_url && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <Volume2 className="h-4 w-4 text-slate-500" aria-hidden />
              <audio controls src={report.voice_url} className="w-full">
                <track kind="captions" />
              </audio>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <MapPin className="h-4 w-4" aria-hidden />
            <h3 className="text-sm font-medium">Geospatial context</h3>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">District</div>
              <div className="mt-1 font-medium text-slate-900">{report.district ?? 'Regional district'}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">State</div>
              <div className="mt-1 font-medium text-slate-900">{report.state ?? 'National response zone'}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Nearest landmark</div>
              <div className="mt-1 font-medium text-slate-900">{report.nearest_landmark ?? 'Major transport corridor'}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">GPS accuracy</div>
              <div className="mt-1 font-medium text-slate-900">{report.estimated_accuracy != null ? `${report.estimated_accuracy * 100}%` : 'Pending'}</div>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <Cpu className="h-4 w-4" aria-hidden />
            <h3 className="text-sm font-medium">AI decision engine</h3>
          </div>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="font-semibold text-slate-900">Why this priority?</div>
              <div className="mt-1">{report.priority_reasoning ?? 'The AI prioritization reflects exposure, access risk, and response urgency.'}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="font-semibold text-slate-900">AI confidence</div>
              <div className="mt-1">{report.ai_confidence_score != null ? `${report.ai_confidence_score * 100}%` : 'Pending'}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="font-semibold text-slate-900">Urgency explanation</div>
              <div className="mt-1">{report.ai_urgency_explanation ?? 'The current assessment indicates a high risk of escalation.'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <Building2 className="h-4 w-4" aria-hidden />
            <h3 className="text-sm font-medium">Operational requirements</h3>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Required vehicles</div>
              <div className="mt-1 text-sm text-slate-900">{(report.required_vehicles ?? []).join(', ')}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Medical teams</div>
              <div className="mt-1 text-sm text-slate-900">{(report.required_medical_teams ?? []).join(', ')}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Food estimate</div>
              <div className="mt-1 text-sm text-slate-900">{report.food_requirement_estimate ?? 0} packs</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Water estimate</div>
              <div className="mt-1 text-sm text-slate-900">{report.water_requirement_estimate ?? 0} liters</div>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <Route className="h-4 w-4" aria-hidden />
            <h3 className="text-sm font-medium">Response planning</h3>
          </div>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="font-semibold text-slate-900">Road accessibility</div>
              <div className="mt-1">{report.road_accessibility ?? 'Assessing access'}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="font-semibold text-slate-900">Evacuation routes</div>
              <div className="mt-1">{(report.suggested_evacuation_routes ?? []).join(' · ')}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="font-semibold text-slate-900">Weather</div>
              <div className="mt-1">{report.weather ?? 'Weather data pending'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
