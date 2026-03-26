import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.getAccessToken();

  const cloned = token
    ? req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      })
    : req;

  return next(cloned).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && isAuthApi(req) === false) {
        return auth.refresh().pipe(
          switchMap((res) => {
            if (res) {
              const retry = req.clone({
                setHeaders: { Authorization: `Bearer ${res.accessToken}` },
              });
              return next(retry);
            }
            router.navigate(['/login']);
            return throwError(() => err);
          }),
          catchError(() => {
            router.navigate(['/login']);
            return throwError(() => err);
          }),
        );
      }
      return throwError(() => err);
    }),
  );
};

function isAuthApi(req: HttpRequest<unknown>): boolean {
  const url = req.url;
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/revoke')
  );
}
