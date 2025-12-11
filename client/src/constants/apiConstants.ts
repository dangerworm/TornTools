const fallbackApiUrl = `https://localhost:7012/api`;

const configuredApiUrl =
  import.meta.env.VITE_API_BASE_URL &&
  import.meta.env.VITE_API_BASE_URL.trim().length > 0
    ? import.meta.env.VITE_API_BASE_URL + '/api'
    : fallbackApiUrl;

export const API_BASE_URL = configuredApiUrl.replace(/\/$/, "");

export const WEAV3R_API_BASE_URL = 'https://weav3r.dev/api';