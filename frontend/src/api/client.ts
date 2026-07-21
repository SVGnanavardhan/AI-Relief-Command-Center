import axios from "axios";
import { supabase } from '../lib/format';

const configuredApiUrl = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8001/api").trim();
const apiBaseUrl = configuredApiUrl.endsWith("/api")
  ? configuredApiUrl
  : `${configuredApiUrl}/api`;

export const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});