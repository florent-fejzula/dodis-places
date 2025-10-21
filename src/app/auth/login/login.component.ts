import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private auth = inject(AuthService);

  email = '';
  password = '';
  error: string | null = null;
  loading = false;

  async loginEmail() {
    this.error = null;
    this.loading = true;
    try {
      await this.auth.loginWithEmail(this.email.trim(), this.password.trim());
    } catch (err: any) {
      this.error = this.mapAuthError(err?.code || err?.message);
    } finally {
      this.loading = false;
    }
  }

  async loginGoogle() {
    this.error = null;
    this.loading = true;
    try {
      await this.auth.loginWithGoogle();
    } catch (err: any) {
      this.error = this.mapAuthError(err?.code || err?.message);
    } finally {
      this.loading = false;
    }
  }

  logout() {
    this.auth.logout();
  }

  // --- 🔹 Friendly Firebase error messages
  private mapAuthError(code: string): string {
    switch (code) {
      case 'auth/invalid-email':
        return 'Invalid email format.';
      case 'auth/user-not-found':
        return 'No account found with this email.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }
}
