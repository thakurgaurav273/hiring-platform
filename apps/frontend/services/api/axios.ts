import axios from "axios";
import { useAppStore } from "@/store/app.store";
import { toast } from "sonner";

// Environment variable for API base URL, fallback to localhost for development
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach access token
api.interceptors.request.use(
  (config) => {
    // Access zustand store directly
    const token = useAppStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const originalRequest = error.config;

    // If error is 401 and it's not the login route itself
    if (
      error.response?.status === 401 &&
      !originalRequest.url?.includes("/auth/login")
    ) {
      // Force logout and clear state
      useAppStore.getState().logout();
      toast.error("Session expired. Please log in again.");
      
      // The auth guard in layout/middleware will handle the redirect
      // or we can force redirect here
      if (typeof window !== "undefined") {
         window.location.href = "/login";
      }
    }

    // Standardize error message extraction
    const message =
      error.response?.data?.message ||
      error.message ||
      "An unexpected error occurred.";

    // Keep the HTTP status so callers (and React Query's retry policy) can
    // tell client errors from network/server failures.
    const err = new Error(message) as Error & { status?: number };
    err.status = error.response?.status;
    return Promise.reject(err);
  }
);
