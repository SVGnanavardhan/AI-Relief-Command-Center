import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8001/api";

export const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
});