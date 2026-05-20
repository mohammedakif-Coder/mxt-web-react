import axios from "axios";
import { env } from "@/config/env";
import { toApiError } from "@/api/errors";

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.apiTimeoutMs,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  config.headers.set("X-Client", env.appName);
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(toApiError(error)),
);

