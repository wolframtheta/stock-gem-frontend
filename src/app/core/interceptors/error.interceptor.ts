import {
  HttpInterceptorFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const messageService = inject(MessageService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        return throwError(() => err);
      }

      let detail =
        err.error?.message ??
        err.error?.error ??
        err.message ??
        'S\'ha produït un error. Torna-ho a provar.';

      if (Array.isArray(detail)) {
        detail = detail.join('. ');
      } else if (typeof detail !== 'string') {
        detail = 'S\'ha produït un error.';
      }

      messageService.add({
        severity: 'error',
        summary: 'Error',
        detail,
        life: 6000,
      });

      return throwError(() => err);
    }),
  );
};
