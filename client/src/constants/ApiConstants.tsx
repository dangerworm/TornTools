const fallbackApiUrl = `https://localhost:7012/api`;

const configuredApiUrl =
  import.meta.env.VITE_API_BASE_URL &&
  import.meta.env.VITE_API_BASE_URL.trim().length > 0
    ? import.meta.env.VITE_API_BASE_URL
    : fallbackApiUrl;

console.log("configuredApiUrl", configuredApiUrl)

export const API_BASE_URL = configuredApiUrl.replace(/\/$/, "");