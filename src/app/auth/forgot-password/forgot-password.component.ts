import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent {
  private auth = inject(AuthService);
  email = '';
  message: string | null = null;
  error: string | null = null;
  loading = false;

  async sendReset() {
    this.error = this.message = null;

    if (!this.email.trim()) {
      this.error = 'Please enter your email.';
      return;
    }

    this.loading = true;
    try {
      await this.auth.resetPassword(this.email.trim());
      this.message = 'Password reset email sent! Please check your inbox.';
    } catch (err: any) {
      this.error = this.mapError(err.code || err.message);
    } finally {
      this.loading = false;
    }
  }

  private mapError(code: string): string {
    switch (code) {
      case 'auth/invalid-email':
        return 'Invalid email format.';
      case 'auth/user-not-found':
        return 'No user found with that email.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }
}
