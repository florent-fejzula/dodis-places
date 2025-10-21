import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
})
export class SignupComponent {
  private auth = inject(AuthService);

  username = '';
  email = '';
  password = '';
  confirm = '';
  error: string | null = null;
  loading = false;

  async signUp() {
    this.error = null;

    if (!this.email.trim() || !this.password.trim() || !this.username.trim()) {
      this.error = 'All fields are required.';
      return;
    }

    if (this.password.length < 6) {
      this.error = 'Password must be at least 6 characters.';
      return;
    }

    if (this.password !== this.confirm) {
      this.error = 'Passwords do not match.';
      return;
    }

    this.loading = true;
    try {
      const userCred = await this.auth.signUpWithEmail(
        this.email,
        this.password,
        this.username
      );
    } catch (err: any) {
      this.error = this.mapAuthError(err?.code || err?.message);
    } finally {
      this.loading = false;
    }
  }

  private mapAuthError(code: string): string {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'This email is already registered.';
      case 'auth/invalid-email':
        return 'Invalid email address.';
      case 'auth/weak-password':
        return 'Password is too weak.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }
}
