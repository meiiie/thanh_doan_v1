import { DOCUMENT } from '@angular/common';
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { CsrfTokenStore } from './csrf-token.store';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export const csrfInterceptor: HttpInterceptorFn = (request, next) => {
  const document = inject(DOCUMENT);
  let target: URL;
  try {
    target = new URL(request.url, document.location.origin);
  } catch {
    return next(request);
  }
  if (
    SAFE_METHODS.has(request.method) ||
    target.origin !== document.location.origin ||
    !target.pathname.startsWith('/api/')
  ) {
    return next(request);
  }

  const cookie = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('XSRF-TOKEN='));
  const cookieToken = cookie ? decodeURIComponent(cookie.slice('XSRF-TOKEN='.length)) : '';
  const token = inject(CsrfTokenStore).token() || cookieToken;
  return next(
    token && !request.headers.has('X-XSRF-TOKEN')
      ? request.clone({ setHeaders: { 'X-XSRF-TOKEN': token } })
      : request,
  );
};
