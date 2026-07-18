const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : "/api/v1";

// --- Token helpers ---
export const getToken = () => localStorage.getItem("lifepilot_token");
export const setToken = (token) => localStorage.setItem("lifepilot_token", token);
export const clearToken = () => localStorage.removeItem("lifepilot_token");

const authHeaders = () => {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

// --- Auth ---
export const signupUser = async (name, email, password) => {
  const response = await fetch(`${API_BASE}/user/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error || "Signup failed");
  setToken(data.data.token);
  return data.data;
};

export const loginUser = async (email, password) => {
  const response = await fetch(`${API_BASE}/user/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error || "Login failed");
  setToken(data.data.token);
  return data.data;
};

export const getMe = async () => {
  const response = await fetch(`${API_BASE}/user/me`, { headers: authHeaders() });
  if (!response.ok) return null;
  const data = await response.json();
  if (!data.success) return null;
  return data.data;
};

export const logout = () => {
  clearToken();
};

// --- Profile ---
export const updateProfile = async ({ name, picture }) => {
  const response = await fetch(`${API_BASE}/user/me`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ name, picture }),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error || "Failed to update profile");
  return data.data;
};

// --- AI Insights ---
export const fetchInsights = async () => {
  const response = await fetch(`${API_BASE}/messages/insights`, { headers: authHeaders() });
  if (!response.ok) throw new Error("Failed to fetch insights");
  const data = await response.json();
  if (!data.success) throw new Error(data.error || "Failed to fetch insights");
  return data.data;
};

// --- Activities ---
export const fetchActivities = async (type = null) => {
  const url = type ? `${API_BASE}/activities?type=${type}` : `${API_BASE}/activities`;
  const response = await fetch(url, { headers: authHeaders() });
  const data = await response.json();
  if (!data.success) throw new Error(data.error || "Failed to fetch activities");
  return data.data;
};

export const saveActivity = async (activity) => {
  const response = await fetch(`${API_BASE}/activities`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(activity),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error || "Failed to save activity");
  return data.data;
};

export const updateActivity = async (id, updates) => {
  const response = await fetch(`${API_BASE}/activities/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(updates),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error || "Failed to update activity");
  return data.data;
};

export const deleteActivityById = async (id) => {
  const response = await fetch(`${API_BASE}/activities/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error || "Failed to delete activity");
  return data;
};

// --- Messages (AI) ---
export const sendMessage = async (message, context = null) => {
  const response = await fetch(`${API_BASE}/messages`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ message, context }),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error || "Something went wrong");
  return data.data;
};

// --- Legacy Google Auth (kept for optional Google Calendar integration) ---
export const getAuthStatus = async () => {
  const response = await fetch(`${API_BASE}/auth/status`);
  return response.json();
};

export const getGoogleAuthUrl = () => `${API_BASE}/auth/google`;

// Events CRUD (Google Calendar)
export const createEventManual = async ({ title, date, startTime, endTime, description }) => {
  const response = await fetch(`${API_BASE}/events`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ title, date, startTime, endTime, description }),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error || "Failed to create event");
  return data.data;
};

export const deleteEventById = async (eventId) => {
  const response = await fetch(`${API_BASE}/events/${eventId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error || "Failed to delete event");
  return data;
};

export const updateEventById = async (eventId, updates) => {
  const response = await fetch(`${API_BASE}/events/${eventId}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(updates),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error || "Failed to update event");
  return data.data;
};
