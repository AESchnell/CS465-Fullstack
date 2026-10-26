import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { AuthenticationService } from '../services/authentication.service';
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthenticationService);
  // Never attach credentials to unrelated hosts or the login request.
  const isAPI = request.url.startsWith('/api/');
  const isLogin = request.url.split('?')[0] === '/api/login';
  const token = auth.getToken();
  const outgoing = isAPI && !isLogin && token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request;
  return next(outgoing).pipe(catchError(error => {
    if (isAPI && !isLogin && error.status === 401) auth.expire();
    return throwError(() => error);
  }));
};
