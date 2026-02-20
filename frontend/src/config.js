const rawUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:8080";
// Strip all trailing slashes using regex for absolute safety
export const BASE_URL = rawUrl.replace(/\/+$/, "");
