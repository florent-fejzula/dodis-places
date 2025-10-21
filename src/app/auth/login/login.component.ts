import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { RouterLink } from '@angular/router';

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

  get user() {
    return this.auth.user();
  }

  loginGoogle() {
    this.auth.loginWithGoogle().catch((err) => (this.error = err.message));
  }

  async loginEmail() {
    this.error = null;
    try {
      await this.auth.loginWithEmail(this.email, this.password);
    } catch (err: any) {
      this.error = err.message;
    }
  }

  logout() {
    this.auth.logout();
  }
}
