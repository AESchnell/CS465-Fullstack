import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthenticationService } from '../services/authentication.service';
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthenticationService);
  const router = inject(Router);
  const login = () => router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  if (!auth.isLoggedIn()) return login();
  return auth.verifySession().pipe(map(() => true), catchError(() => of(login())));
};
