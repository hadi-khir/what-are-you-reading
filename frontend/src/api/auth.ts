import { api } from "./client";
import type { UserMe } from "../types";

interface TokenResponse {
  access_token: string;
  token_type: string;
}

export const authApi = {
  register: (username: string, email: string, password: string) =>
    api.post<TokenResponse>("/auth/register", { username, email, password }),

  login: (username: string, password: string) =>
    api.post<TokenResponse>("/auth/login", { username, password }),

  me: () => api.get<UserMe>("/auth/me"),
};
