const fallbackApiUrl = `${window.location.origin}/api`;

const configuredApiUrl =
  import.meta.env.VITE_API_BASE_URL &&
  import.meta.env.VITE_API_BASE_URL.trim().length > 0
    ? import.meta.env.VITE_API_BASE_URL
    : fallbackApiUrl;

export const API_BASE_URL = configuredApiUrl.replace(/\/$/, "");