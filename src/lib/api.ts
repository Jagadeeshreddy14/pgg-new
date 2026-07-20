const API_BASE = "/api";

export function getToken(): string | null {
  return localStorage.getItem("srinivasa_access_token");
}

export function setToken(token: string) {
  localStorage.setItem("srinivasa_access_token", token);
}

export function clearToken() {
  localStorage.removeItem("srinivasa_access_token");
  localStorage.removeItem("srinivasa_refresh_token");
}

export async function apiRequest<T = any>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: any
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const api = {
  get: <T = any>(endpoint: string) => apiRequest<T>(endpoint, "GET"),
  post: <T = any>(endpoint: string, body?: any) => apiRequest<T>(endpoint, "POST", body),
  put: <T = any>(endpoint: string, body?: any) => apiRequest<T>(endpoint, "PUT", body),
  delete: <T = any>(endpoint: string) => apiRequest<T>(endpoint, "DELETE"),
};
export default api;
