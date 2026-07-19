import { api } from './client';
import { mapDashboard, mapReports } from './mappers';
import type { CreateReportPayload, DashboardData, Report, Team } from '../types';

export async function getDashboard(): Promise<DashboardData> {
  const { data } = await api.get('/dashboard');
  return mapDashboard(data);
}

export async function getReports(): Promise<Report[]> {
  const { data } = await api.get('/reports');
  return mapReports(data);
}

export async function getReport(id: string): Promise<Report> {
  const { data } = await api.get(`/reports/${id}`);
  const mapped = mapReports([data]);
  return mapped[0];
}

export async function submitReport(payload: CreateReportPayload): Promise<Report> {
  const formData = new FormData();
  formData.append('description', payload.description);
  formData.append('location', payload.location);

  if (payload.image) {
    formData.append('image', payload.image);
  }

  if (payload.voice) {
    formData.append('audio', payload.voice);
  }

  const { data } = await api.post('/report', formData);
  return mapReports([data])[0];
}

export async function getTeams(): Promise<Team[]> {
  const { data } = await api.get('/teams');
  return data as Team[];
}

export async function assignTeamToReport(reportId: string | number, teamId: string | number): Promise<{ status: string; assigned_team?: string | null; assigned_team_id?: string | number | null }> {
  const { data } = await api.post(`/reports/${reportId}/assign-team/${teamId}`);
  return data;
}

export async function updateIncidentStatus(reportId: string | number, status: string, note?: string): Promise<{ status: string }> {
  const { data } = await api.post(`/reports/${reportId}/status`, { status, note });
  return data;
}

export async function runSimulation(count = 25): Promise<Record<string, unknown>> {
  const { data } = await api.post('/simulation/run', { count });
  return data;
}

export async function getSimulationStatus(): Promise<Record<string, unknown>> {
  const { data } = await api.get('/simulation/status');
  return data;
}
