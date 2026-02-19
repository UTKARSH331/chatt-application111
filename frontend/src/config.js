const rawUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:8080";
export const BASE_URL = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;
