import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import type { Report } from '../types';
import { getReports, getSimulationStatus, runSimulation } from '../api/reports';
import { apiErrorMessage } from '../api/mappers';
import { formatTimestamp, priorityConfig } from '../lib/format';
import { ErrorState, LoadingState } from '../components/StatusPill';
import { PlayCircle } from 'lucide-react';

function markerIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<span style="display:inline-block;width:16px;height:16px;border-radius:9999px;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.4);background:${color}"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export default function InteractiveMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [simulating, setSimulating] = useState(false);
  const [simulationStatus, setSimulationStatus] = useState<Record<string, unknown>>({ status: 'idle', total: 0, completed: 0, progress: 0, message: 'No simulation running.' });
  const navigate = useNavigate();

  const goToIncident = useCallback((id: string) => {
    navigate(`/incident/${id}`);
  }, [navigate]);

  const refreshReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getReports();
      setReports(data);
    } catch (err) {
      setError(apiErrorMessage(err, 'reports'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void refreshReports();
    const interval = window.setInterval(() => {
      if (active) {
        void refreshReports();
      }
    }, 15000);
    const statusInterval = window.setInterval(() => {
      if (active) {
        void getSimulationStatus().then(setSimulationStatus).catch(() => undefined);
      }
    }, 1000);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.clearInterval(statusInterval);
    };
  }, [refreshReports]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [22.5937, 88.3629],
      zoom: 5,
      scrollWheelZoom: true,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.clearLayers();
    const bounds: [number, number][] = [];
    reports.forEach((r) => {
      if (r.latitude == null || r.longitude == null) return;
      const cfg = priorityConfig[r.priority];
      bounds.push([r.latitude, r.longitude]);
      const m = L.marker([r.latitude, r.longitude], { icon: markerIcon(cfg.marker) });
      const resources = r.suggested_resources?.length ? r.suggested_resources.join(', ') : 'No specific resources assigned';
      const summary = r.ai_summary || 'No AI summary available yet.';
      const description = r.description || 'No description provided.';
      const timestamp = formatTimestamp(r.timestamp);
      m.bindPopup(
        `<div style="font-size:13px;line-height:1.5;font-family:inherit;max-width:300px">
          <div style="font-weight:700;margin-bottom:4px">${escapeHtml(r.location)}</div>
          <div style="text-transform:capitalize;color:#475569;margin-bottom:4px">${escapeHtml(r.category)} · ${cfg.label}</div>
          <div style="margin-bottom:4px"><strong>Incident ID:</strong> ${escapeHtml(r.id)}</div>
          <div style="margin-bottom:4px"><strong>Description:</strong> ${escapeHtml(description)}</div>
          <div style="margin-bottom:4px"><strong>AI Summary:</strong> ${escapeHtml(summary)}</div>
          <div style="margin-bottom:4px"><strong>Resources:</strong> ${escapeHtml(resources)}</div>
          <div style="margin-bottom:6px"><strong>Coordinates:</strong> ${escapeHtml(`${r.latitude?.toFixed(4)}, ${r.longitude?.toFixed(4)}`)}</div>
          <div style="margin-bottom:8px"><strong>Timestamp:</strong> ${escapeHtml(timestamp)}</div>
          <a href="/incident/${r.id}" style="color:#0f172a;font-weight:600">Open details →</a>
        </div>`
      );
      m.on('click', () => goToIncident(r.id));
      layer.addLayer(m);
    });
    if (bounds.length > 1 && mapRef.current) {
      mapRef.current.fitBounds(bounds, { padding: [32, 32] });
    } else if (bounds.length === 1 && mapRef.current) {
      mapRef.current.setView(bounds[0], 8);
    }
  }, [goToIncident, reports]);

  const runDemoSimulation = async () => {
    setSimulating(true);
    setError('');
    try {
      const response = await runSimulation(25);
      setSimulationStatus(response);
      await refreshReports();
    } catch (err) {
      setError(apiErrorMessage(err, 'simulation'));
    } finally {
      setSimulating(false);
    }
  };

  const summary = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 } as Record<keyof typeof priorityConfig, number>;
    reports.forEach((r) => {
      counts[r.priority] += 1;
    });
    return counts;
  }, [reports]);

  return (
    <div className="space-y-4">
      <div className="rounded-[32px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-700 p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">Interactive map</p>
            <h2 className="mt-2 text-2xl font-semibold">Geospatial incident command</h2>
            <p className="mt-2 text-sm text-slate-300">Critical, high, medium, and low priority incidents are plotted with clear visual cues.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-200">
            <button type="button" onClick={() => void runDemoSimulation()} disabled={simulating} className="inline-flex items-center gap-2 rounded-full border border-cyan-400/50 bg-cyan-500/15 px-3 py-2 font-medium text-cyan-100 transition hover:bg-cyan-500/25 disabled:opacity-70">
              <PlayCircle className="h-4 w-4" /> {simulating ? 'Running simulation…' : 'Run Disaster Simulation'}
            </button>
            {(['critical', 'high', 'medium', 'low'] as const).map((p) => (
              <span key={p} className="inline-flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-full border border-white" style={{ backgroundColor: priorityConfig[p].marker }} />
                {priorityConfig[p].label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-semibold text-slate-900">Live mission progress</div>
            <div className="mt-1">{String(simulationStatus.message ?? 'No simulation running.')}</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold text-slate-900">{Number(simulationStatus.completed ?? 0)}/{Number(simulationStatus.total ?? 0)}</div>
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">incidents processed</div>
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-cyan-600 transition-all" style={{ width: `${Math.max(0, Math.min(100, Number(simulationStatus.progress ?? 0)))}%` }} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-medium text-slate-500">Locations pinned</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{reports.length}</p>
        </div>
        {(['critical', 'high', 'medium', 'low'] as const).map((p) => (
          <div key={p} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-medium text-slate-500">{priorityConfig[p].label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{summary[p]}</p>
          </div>
        ))}
      </div>

      <div className="relative h-[70vh] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        {loading && (
          <div className="absolute inset-0 z-[500] flex items-center justify-center bg-white/80">
            <LoadingState label="Loading map…" />
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 z-[500] flex items-center justify-center p-6">
            <ErrorState message={error} />
          </div>
        )}
        <div ref={containerRef} className="h-full w-full" />
      </div>

      {!loading && !error && reports.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
          Showing {reports.length} report{reports.length === 1 ? '' : 's'}.{' '}
          <Link to="/queue" className="font-medium text-slate-700 hover:text-slate-900">
            View priority queue →
          </Link>
        </div>
      )}
      {!loading && !error && reports.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
          No reports with coordinates available yet.
        </div>
      )}
    </div>
  );
}
