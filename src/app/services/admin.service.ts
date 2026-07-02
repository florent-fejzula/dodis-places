import { Injectable, signal, inject, effect } from '@angular/core';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private auth = inject(AuthService);

  // ✅ Single source of truth used across the app
  readonly isAdmin = signal<boolean>(false);

  private readonly ADMIN_EMAIL = 'fejzula.florent@hotmail.com';

  constructor() {
    effect(() => {
      const email = this.auth.user()?.email ?? null;
      this.isAdmin.set(email === this.ADMIN_EMAIL);
    });
  }
}
