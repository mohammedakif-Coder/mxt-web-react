import { apiClient } from "@/api/client";

export type AuthUser = Record<string, unknown>;

export type AuthResponse = {
  token: string;
  refreshToken: string;
  user: AuthUser;
};

export type LoginPayload = {
  username: string;
  password: string;
  email: string;
};

export type MxtCustomerRegisterPayload = {
  username: string;
  password: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_mobile: string;
};

export type AdminRegisterPayload = {
  username: string;
  password: string;
  name: string;
  email: string;
  role: string;
};

export const authApi = {
  async login(payload: LoginPayload) {
    const { data } = await apiClient.post<AuthResponse>("/auth/api/v1/login", payload);
    return data;
  },

  async registerMxtCustomer(payload: MxtCustomerRegisterPayload) {
    const { data } = await apiClient.post("/api/v1/create-mxt-account/public", payload);
    return data;
  },

  async registerAdmin(payload: AdminRegisterPayload) {
    const { data } = await apiClient.post("/auth/api/v1/register", payload);
    return data;
  },
};

