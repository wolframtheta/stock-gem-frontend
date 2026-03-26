export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'botiga';
  fairId?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}
