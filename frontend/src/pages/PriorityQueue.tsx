import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Filter, ChevronLeft, ChevronRight, ShieldAlert, Compass, Brain, Clock3, RefreshCw } from 'lucide-react';
import type { Priority, Report } from '../types';
import { getReports } from '../api/reports';
import { apiErrorMessage } from '../api/mappers';
import PriorityBadge from '../components/PriorityBadge';
import { ErrorState, LoadingState, EmptyState } from '../components/StatusPill';
import { categoryConfig, formatRelativeTime, formatTimestamp } from '../lib/format';

type SortKey = 'urgency_score' | 'timestamp' | 'location' | 'category';
type SortDir = 'asc' | 'desc';
type PriorityFilter = 'all' | Priority;

const PAGE_SIZE = 8;
const PRIORITY_FILTERS: PriorityFilter[] = ['all', 'critical', 'high', 'medium', 'low'];
const CATEGORY_FILTERS = ['all', 'medical', 'rescue', 'shelter', 'food', 'other'] as const;
type CategoryFilter = (typeof CATEGORY_FILTERS)[number];

export default function PriorityQueue() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('urgency_score');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [search, setSearch] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<PriorityFilter>('all');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const loadReports = useCallback(async () => {
    setRefreshing(true);
    setError('');
    try {
      const data = await getReports();
      setReports(data);
    } catch (err) {
      setError(apiErrorMessage(err, 'reports'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void loadReports();
    const interval = window.setInterval(() => {
      if (active) {
        void loadReports();
      }
    }, 15000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [loadReports]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return reports.filter((item) => {
      const matchesPriority = selectedPriority === 'all' || item.priority === selectedPriority;
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const haystack = `${item.location} ${item.category} ${item.description}`.toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      return matchesPriority && matchesCategory && matchesQuery;
    });
  }, [reports, search, selectedCategory, selectedPriority]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'urgency_score') {
        cmp = (a.urgency_score ?? 0) - (b.urgency_score ?? 0);
      } else if (sortKey === 'timestamp') {
        cmp = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      } else {
        cmp = String(a[sortKey]).localeCompare(String(b[sortKey]));
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sorted.slice(start, start + PAGE_SIZE);
  }, [page, sorted]);

  useEffect(() => {
    setPage(1);
  }, [search, selectedCategory, selectedPriority]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'urgency_score' || key === 'timestamp' ? 'desc' : 'asc');
    }
  };

  const SortIcon = ({ active }: { active: boolean }) =>
    !active ? (
      <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
    ) : sortDir === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5 text-slate-900" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-slate-900" />
    );

  if (loading) return <LoadingState label="Loading reports…" />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-4">
      <section className="rounded-[24px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-700 p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Priority queue</p>
            <h2 className="mt-2 text-2xl font-semibold">Operational triage board</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Every incident is ranked by urgency so teams can focus on the highest-impact needs first.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-medium text-cyan-200">
              <ShieldAlert className="h-4 w-4" /> {sorted.length} active incidents
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-2">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search queue"
            className="w-40 bg-transparent text-sm outline-none"
          />
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
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
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
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
        </div>
        <button
          type="button"
          onClick={() => void loadReports()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
        <span className="ml-auto text-sm text-slate-500">
          Showing {sorted.length} incident{sorted.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {[
                { key: 'location' as SortKey, label: 'Location' },
                { key: 'category' as SortKey, label: 'Category' },
                { key: 'urgency_score' as SortKey, label: 'Score' },
                { key: 'timestamp' as SortKey, label: 'Time' },
              ].map((col) => (
                <th key={col.key} className="px-5 py-2 font-medium">
                  <button onClick={() => toggleSort(col.key)} className="inline-flex items-center gap-1 hover:text-slate-900">
                    {col.label}
                    <SortIcon active={sortKey === col.key} />
                  </button>
                </th>
              ))}
              <th className="px-5 py-2 font-medium">Priority</th>
              <th className="px-5 py-2 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.length ? (
              paginated.map((r) => {
                const CategoryIcon = categoryConfig[r.category]?.icon ?? categoryConfig.other.icon;
                return (
                  <tr key={r.id} className="cursor-pointer transition hover:bg-slate-50" onClick={() => navigate(`/incident/${r.id}`)}>
                    <td className="px-5 py-3">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl ${categoryConfig[r.category]?.accent ?? categoryConfig.other.accent}`}>
                          <CategoryIcon className="h-4 w-4" aria-hidden />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{r.location}</div>
                          <div className="mt-1 line-clamp-2 text-xs text-slate-500">{r.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-700">
                        {r.category}
                      </span>
                    </td>
                    <td className="px-5 py-3 tabular-nums text-slate-600">{Math.round((r.urgency_score ?? 0) * 100)}</td>
                    <td className="px-5 py-3 text-slate-500">
                      <div>{formatTimestamp(r.timestamp)}</div>
                      <div className="text-xs text-slate-400">{formatRelativeTime(r.timestamp)}</div>
                    </td>
                    <td className="px-5 py-3">
                      <PriorityBadge priority={r.priority} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2 text-sm font-medium text-slate-700">
                        <Compass className="h-4 w-4" />
                        <Brain className="h-4 w-4" />
                        <Clock3 className="h-4 w-4" />
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6}>
                  <EmptyState message="No reports match the current filters." />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {sorted.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page === totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
