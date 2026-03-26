import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of, shareReplay } from 'rxjs';
import type { AuthResponse, AuthUser } from '../models/auth.model';

const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = `${process.env.NG_APP_API_URL ?? 'http://localhost:3500/api'}/auth`;

  private readonly tokenSignal = signal<string | null>(
    typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null,
  );
  private readonly refreshTokenSignal = signal<string | null>(
    typeof localStorage !== 'undefined'
      ? localStorage.getItem(REFRESH_TOKEN_KEY)
      : null,
  );
  private readonly userSignal = signal<AuthUser | null>(
    (() => {
      if (typeof localStorage === 'undefined') return null;
      const stored = localStorage.getItem(USER_KEY);
      return stored ? (JSON.parse(stored) as AuthUser) : null;
    })(),
  );

  private refreshInFlight: Observable<AuthResponse | null> | null = null;

  readonly isAuthenticated = computed(() => !!this.tokenSignal());
  readonly currentUser = computed(() => this.userSignal());
  readonly refreshToken = computed(() => this.refreshTokenSignal());

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(tap((res) => this.setSession(res)));
  }

  register(
    email: string,
    password: string,
    name: string,
    role?: 'admin' | 'botiga',
  ): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/register`, {
        email,
        password,
        name,
        ...(role && { role }),
      })
      .pipe(tap((res) => this.setSession(res)));
  }

  refresh(): Observable<AuthResponse | null> {
    const refresh = this.refreshTokenSignal();
    if (!refresh || refresh.length === 0) return of(null);

    if (!this.refreshInFlight) {
      this.refreshInFlight = this.http
        .post<AuthResponse>(`${this.apiUrl}/refresh`, { refreshToken: refresh })
        .pipe(
          tap((res) => {
            this.setSession(res);
            this.refreshInFlight = null;
          }),
          catchError(() => {
            this.refreshInFlight = null;
            this.logout();
            return of(null);
          }),
          shareReplay({ bufferSize: 1, refCount: true }),
        );
    }
    return this.refreshInFlight;
  }

  logout(): void {
    const refresh = this.refreshTokenSignal();
    if (refresh) {
      this.http
        .post(`${this.apiUrl}/revoke`, { refreshToken: refresh })
        .subscribe({ error: () => {} });
    }
    this.clearSession();
    this.router.navigate(['/login']);
  }

  getAccessToken(): string | null {
    return this.tokenSignal();
  }

  private setSession(res: AuthResponse): void {
    this.tokenSignal.set(res.accessToken);
    this.refreshTokenSignal.set(res.refreshToken ?? '');
    this.userSignal.set(res.user);
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken ?? '');
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
  }

  private clearSession(): void {
    this.tokenSignal.set(null);
    this.refreshTokenSignal.set(null);
    this.userSignal.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}
