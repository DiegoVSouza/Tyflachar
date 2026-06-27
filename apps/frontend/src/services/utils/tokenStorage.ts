const TOKEN_KEY = 'auth_token' as const;
const REFRESH_TOKEN_KEY = 'auth_refresh_token' as const;

export const tokenStorage = {
  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setRefreshToken(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  clearTokens(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  hasToken(): boolean {
    return Boolean(localStorage.getItem(TOKEN_KEY));
  },
} as const;
