import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { filter, firstValueFrom, take } from 'rxjs';
import { AdminService } from '../services/admin.service';
import { AuthService } from './auth.service';

/**
 * Blocks the /admin area for everyone but the admin account.
 *
 * This is UX, not security: it stops the routes being reachable by URL and
 * keeps admin screens out of the public app. The writes behind them are
 * secured by Firestore/Storage rules (see firestore.rules).
 */
export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const admin = inject(AdminService);
  const router = inject(Router);

  // Firebase restores the session asynchronously — without this, a page load
  // straight onto an admin URL bounces before we know who the user is.
  await firstValueFrom(
    toObservable(auth.loading).pipe(
      filter((loading) => !loading),
      take(1)
    )
  );

  return admin.isAdmin() ? true : router.createUrlTree(['/places']);
};
