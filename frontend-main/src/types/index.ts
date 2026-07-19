export type Priority = 'critical' | 'high' | 'medium' | 'low';

export type Category =
  | 'medical'
  | 'rescue'
  | 'shelter'
  | 'food'
  | 'fire'
  | 'flood'
  | 'road'
  | 'other';

export interface Report {
  id: string;
  description: string;
  location: string;
  image_url?: string | null;
  voice_url?: string | null;
  ai_summary?: string | null;
  reasoning?: string | null;
  category: Category;
  urgency_score: number;
  priority: Priority;
  suggested_resources: string[];
  latitude?: number | null;
  longitude?: number | null;
  timestamp: string;
  status?: string;
  assigned_team?: string | null;
  assigned_team_id?: string | number | null;
  confidence_score?: number;
  transcript?: string;
  district?: string | null;
  state?: string | null;
  country?: string | null;
  nearest_landmark?: string | null;
  estimated_accuracy?: number | null;
  weather?: string | null;
  road_accessibility?: string | null;
  suggested_evacuation_routes?: string[];
  predicted_impact_radius_km?: number | null;
  affected_population_estimate?: number | null;
  ai_urgency_explanation?: string | null;
  ai_confidence_score?: number | null;
  priority_reasoning?: string | null;
  required_resources?: string[];
  required_vehicles?: string[];
  required_medical_teams?: string[];
  food_requirement_estimate?: number | null;
  water_requirement_estimate?: number | null;
  temporary_shelter_estimate?: number | null;
  current_status?: string | null;
  dispatch_history?: Array<Record<string, unknown>>;
  mission_log?: Array<Record<string, unknown>>;
}

export interface Team {
  id: string | number;
  name: string;
  members?: number;
  vehicle?: string | null;
  equipment?: string[];
  gps_location?: string | null;
  availability?: string;
  status?: string;
  current_mission?: string | null;
  eta_minutes?: number | null;
  capacity?: number | null;
  created_at?: string;
}

export interface DashboardData {
  total_reports: number;
  pending_incidents: number;
  ai_reviewed: number;
  teams_assigned: number;
  teams_en_route: number;
  rescue_in_progress: number;
  successfully_resolved: number;
  closed_incidents: number;
  people_rescued: number;
  people_awaiting_rescue: number;
  medical_requests: number;
  fire_emergencies: number;
  flood_emergencies: number;
  average_response_time: number;
  average_rescue_time: number;
  active_rescue_teams: number;
  available_teams: number;
  busy_teams: number;
  critical_incidents: number;
  medical_cases: number;
  rescue_cases: number;
  shelter_requests: number;
  food_requests: number;
  category_distribution: { name: string; value: number }[];
  urgency_trend: { time: string; critical: number; high: number; medium: number; low: number }[];
  recent_incidents: Report[];
  notifications: Array<Record<string, unknown>>;
  activity_feed: Array<Record<string, unknown>>;
  mission_success_rate: number;
  completed_today: number;
  completed_this_week: number;
  average_completion_time: number;
  lives_saved: number;
  resources_used: number;
}

export interface CreateReportPayload {
  description: string;
  location: string;
  image?: File;
  voice?: File;
}
