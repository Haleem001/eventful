import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

const FRIENDLY_ERRORS: Record<number, string> = {
  400: "Invalid request. Please check your input.",
  401: "Please sign in to continue.",
  403: "You don't have permission to do that.",
  404: "Not found. It may have been removed.",
  409: "This action conflicts with the current state. Please refresh.",
  422: "Unable to process the provided data.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "Something went wrong on our end. Please try again later.",
};

function normalizeError(err: any): string {
  if (typeof err === "string") return err;

  const data = err?.response?.data;
  const status = err?.response?.status;

  if (data) {
    if (typeof data.message === "string" && data.message.length > 0) {
      return data.message;
    }
    if (Array.isArray(data.message) && data.message.length > 0) {
      return data.message[0];
    }
    if (typeof data.error === "string") {
      return data.error;
    }
  }

  if (status && FRIENDLY_ERRORS[status]) {
    return FRIENDLY_ERRORS[status];
  }

  if (err?.message === "Network Error") {
    return "Unable to connect. Check your internet connection.";
  }

  return "Something went wrong. Please try again.";
}

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("accessToken");
    }
    err.friendlyMessage = normalizeError(err);
    return Promise.reject(err);
  },
);

export default api;
