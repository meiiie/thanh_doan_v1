import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { Injector, inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, tap, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { SessionLifecycleService } from './session-lifecycle.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const injector = inject(Injector);
  const router = inject(Router);
  const session = inject(SessionLifecycleService);

  return next(request).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        session.observe(event.headers.get('X-Session-Expires-At'));
      }
    }),
    catchError((error) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !request.url.startsWith('/api/auth/') &&
        !router.url.startsWith('/login')
      ) {
        const returnUrl =
          router.url.startsWith('/') && !router.url.startsWith('//') ? router.url : '/';
        injector.get(AuthService).clear();
        void router.navigate(['/login'], {
          queryParams: { reason: 'session-expired', returnUrl },
          replaceUrl: true,
        });
      }
      return throwError(() => error);
    }),
  );
};
