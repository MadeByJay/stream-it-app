export interface AuthUser {
  id: number;
  email: string;
  isAdmin: boolean;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}
