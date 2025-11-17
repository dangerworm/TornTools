const fallbackApiUrl = `${window.location.protocol}//${window.location.hostname}:5185/api`;

const configuredApiUrl =
  import.meta.env.VITE_API_BASE_URL &&
  import.meta.env.VITE_API_BASE_URL.trim().length > 0
    ? import.meta.env.VITE_API_BASE_URL
    : fallbackApiUrl;

console.log("configuredApiUrl", configuredApiUrl)

export const API_BASE_URL = configuredApiUrl.replace(/\/$/, "");