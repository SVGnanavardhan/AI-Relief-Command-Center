import type { DashboardData, Report } from '../types';

type ApiRecord = Record<string, unknown>;

type ErrorLike = {
  code?: string;
  response?: {
    status?: number;
    data?: unknown;
  };
  message?: string;
};

function pick<T extends ApiRecord, K extends readonly string[]>(obj: T, keys: K): number {
  for (const key of keys) {
    const value = obj[key];
    if (value !== undefined && value !== null) {
      const numeric = Number(value);
      return Number.isNaN(numeric) ? 0 : numeric;
    }
  }
  return 0;
}

function asRecord(value: unknown): ApiRecord {
  return (typeof value === 'object' && value !== null ? value : {}) as ApiRecord;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function mapDistributionItem(item: unknown): { name: string; value: number } {
  const record = asRecord(item);
  const name = typeof record.name === 'string' ? record.name : typeof record.category === 'string' ? record.category : 'Other';
  const value = typeof record.value === 'number' ? record.value : typeof record.count === 'number' ? record.count : 0;
  return { name, value };
}

function mapReport(raw: unknown): Report {
  const record = asRecord(raw);
  return {
    id: String(record.id ?? ''),
    description: typeof record.description === 'string' ? record.description : '',
    location: typeof record.location === 'string' ? record.location : 'Unknown',
    image_url: typeof record.image_url === 'string' ? record.image_url : null,
    voice_url: typeof record.voice_url === 'string' ? record.voice_url : typeof record.audio_url === 'string' ? record.audio_url : null,
    ai_summary: typeof record.ai_summary === 'string' ? record.ai_summary : null,
    reasoning: typeof record.reasoning === 'string' ? record.reasoning : null,
    category: typeof record.category === 'string' ? (record.category as Report['category']) : 'other',
    urgency_score: Number(record.urgency_score ?? 0),
    priority: typeof record.priority === 'string' ? (record.priority as Report['priority']) : 'low',
    suggested_resources: asStringArray(record.suggested_resources).length
      ? asStringArray(record.suggested_resources)
      : asStringArray(record.resources),
    latitude: typeof record.latitude === 'number' ? record.latitude : null,
    longitude: typeof record.longitude === 'number' ? record.longitude : null,
    timestamp: typeof record.timestamp === 'string' ? record.timestamp : '',
    status: typeof record.status === 'string' ? record.status : undefined,
    district: typeof record.district === 'string' ? record.district : null,
    state: typeof record.state === 'string' ? record.state : null,
    country: typeof record.country === 'string' ? record.country : null,
    nearest_landmark: typeof record.nearest_landmark === 'string' ? record.nearest_landmark : null,
    estimated_accuracy: typeof record.estimated_accuracy === 'number' ? record.estimated_accuracy : null,
    weather: typeof record.weather === 'string' ? record.weather : null,
    road_accessibility: typeof record.road_accessibility === 'string' ? record.road_accessibility : null,
    suggested_evacuation_routes: asStringArray(record.suggested_evacuation_routes),
    predicted_impact_radius_km: typeof record.predicted_impact_radius_km === 'number' ? record.predicted_impact_radius_km : null,
    affected_population_estimate: typeof record.affected_population_estimate === 'number' ? record.affected_population_estimate : null,
    ai_urgency_explanation: typeof record.ai_urgency_explanation === 'string' ? record.ai_urgency_explanation : null,
    ai_confidence_score: typeof record.ai_confidence_score === 'number' ? record.ai_confidence_score : null,
    priority_reasoning: typeof record.priority_reasoning === 'string' ? record.priority_reasoning : null,
    required_resources: asStringArray(record.required_resources),
    required_vehicles: asStringArray(record.required_vehicles),
    required_medical_teams: asStringArray(record.required_medical_teams),
    food_requirement_estimate: typeof record.food_requirement_estimate === 'number' ? record.food_requirement_estimate : null,
    water_requirement_estimate: typeof record.water_requirement_estimate === 'number' ? record.water_requirement_estimate : null,
    temporary_shelter_estimate: typeof record.temporary_shelter_estimate === 'number' ? record.temporary_shelter_estimate : null,
    current_status: typeof record.current_status === 'string' ? record.current_status : null,
    dispatch_history: Array.isArray(record.dispatch_history) ? record.dispatch_history as Array<Record<string, unknown>> : [],
    mission_log: Array.isArray(record.mission_log) ? record.mission_log as Array<Record<string, unknown>> : [],
  } as Report;
}

export function mapReports(raw: unknown): Report[] {
  const record = asRecord(raw);
  const arr = Array.isArray(raw) ? raw : (record.reports ?? record.data ?? []);
  return Array.isArray(arr) ? arr.map(mapReport) : [];
}

export function mapDashboard(raw: unknown): DashboardData {
  const record = asRecord(raw);
  const trend = record.urgency_trend ?? record.trend ?? [];
  const dist = record.category_distribution ?? record.categories ?? [];
  return {
    total_reports: pick(record, ['total_reports', 'total']),
    pending_incidents: pick(record, ['pending_incidents', 'pending']),
    ai_reviewed: pick(record, ['ai_reviewed', 'reviewed']),
    teams_assigned: pick(record, ['teams_assigned', 'assigned']),
    teams_en_route: pick(record, ['teams_en_route', 'en_route']),
    rescue_in_progress: pick(record, ['rescue_in_progress', 'in_progress']),
    successfully_resolved: pick(record, ['successfully_resolved', 'resolved']),
    closed_incidents: pick(record, ['closed_incidents', 'closed']),
    people_rescued: pick(record, ['people_rescued', 'rescued']),
    people_awaiting_rescue: pick(record, ['people_awaiting_rescue', 'awaiting_rescue']),
    medical_requests: pick(record, ['medical_requests', 'medical']),
    fire_emergencies: pick(record, ['fire_emergencies', 'fire']),
    flood_emergencies: pick(record, ['flood_emergencies', 'flood']),
    average_response_time: pick(record, ['average_response_time', 'response_time']),
    average_rescue_time: pick(record, ['average_rescue_time', 'rescue_time']),
    active_rescue_teams: pick(record, ['active_rescue_teams', 'active_teams']),
    available_teams: pick(record, ['available_teams', 'available']),
    busy_teams: pick(record, ['busy_teams', 'busy']),
    critical_incidents: pick(record, ['critical_reports', 'critical_incidents', 'critical']),
    medical_cases: pick(record, ['medical_cases', 'medical']),
    rescue_cases: pick(record, ['rescue_cases', 'rescue']),
    shelter_requests: pick(record, ['shelter_cases', 'shelter_requests', 'shelter']),
    food_requests: pick(record, ['food_cases', 'food_requests', 'food']),
    category_distribution: Array.isArray(dist) ? dist.map(mapDistributionItem) : [],
    urgency_trend: Array.isArray(trend) ? trend : [],
    recent_incidents: mapReports(record.recent_incidents ?? record.recent ?? []),
    notifications: Array.isArray(record.notifications) ? record.notifications : [],
    activity_feed: Array.isArray(record.activity_feed) ? record.activity_feed : [],
    mission_success_rate: pick(record, ['mission_success_rate', 'success_rate']),
    completed_today: pick(record, ['completed_today', 'today']),
    completed_this_week: pick(record, ['completed_this_week', 'this_week']),
    average_completion_time: pick(record, ['average_completion_time', 'completion_time']),
    lives_saved: pick(record, ['lives_saved', 'saved']),
    resources_used: pick(record, ['resources_used', 'resources']),
  } as DashboardData;
}

export function apiErrorMessage(
  err: unknown,
  context: 'dashboard' | 'reports' | 'incident' | 'submit' = 'reports',
): string {
  if (!err) return 'An unexpected error occurred.';
  const error = err as ErrorLike;
  const code = error?.code;
  const status = error?.response?.status;
  const data = error?.response?.data;

  if (code === 'ECONNABORTED') return 'Network timeout. The server took too long to respond.';
  if (code === 'ERR_NETWORK' || status === 0)
    return 'Backend unavailable. Please check that the server is running.';

  if (status === 404) {
    if (context === 'incident') return 'Incident not found.';
    if (context === 'reports') return 'No reports found.';
    return 'Resource not found.';
  }
  if (status === 502 || status === 503 || status === 504)
    return 'Backend unavailable. Please try again shortly.';

  const body = typeof data === 'string' ? data : JSON.stringify(data ?? '');
  if (/gemini|ai processing|model/i.test(body))
    return 'Gemini processing failed. Please retry the report.';

  if (context === 'submit') return 'Submission failed. Please try again.';
  if (status && status >= 500) return 'The server encountered an error. Please try again.';
  return 'Invalid response from server.';
}
