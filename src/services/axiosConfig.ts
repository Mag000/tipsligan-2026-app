import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { getToken } from "../utils/authHelpers";

const API_BASE_URL = "/api";

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: Auto-inject Bearer token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  },
);

// Response interceptor: Handle 401 Unauthorized
axiosInstance.interceptors.response.use(
  (response) => {
    console.log(
      `✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`,
    );
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      console.warn("🔐 401 Unauthorized - clearing token");
      localStorage.removeItem("token");
      // ProtectedRoute will handle redirect
    }
    return Promise.reject(error);
  },
);

// Export types for convenience
export type { AxiosError, AxiosResponse } from "axios";
