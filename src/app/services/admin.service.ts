import { Injectable, signal, inject, effect } from '@angular/core';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private auth = inject(AuthService);

  // ✅ Single source of truth used across the app
  readonly isAdmin = signal<boolean>(false);

  // ✅ Your allowed admin UIDs
  private readonly ADMIN_UIDS = new Set<string>([
    'bEznhQ3reANPyXJpdXUA8t0YsAK2',
    'JgNkpn0HUOR0v9fw1eLqhwpgzo32',
  ]);

  constructor() {
    // Whenever auth.user() changes, update admin state
    effect(() => {
      const uid = this.auth.user()?.uid ?? null;
      this.isAdmin.set(!!uid && this.ADMIN_UIDS.has(uid));
    });
  }
}
