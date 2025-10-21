import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
})
export class SignupComponent {
  private auth = inject(AuthService);
  email = '';
  password = '';
  confirm = '';
  error: string | null = null;
  message: string | null = null;

  async signUp() {
    this.error = this.message = null;
    if (this.password !== this.confirm) {
      this.error = 'Passwords do not match.';
      return;
    }

    try {
      await this.auth.signUpWithEmail(this.email, this.password);
      this.message = 'Account created! You can now log in.';
      this.email = this.password = this.confirm = '';
    } catch (err: any) {
      this.error = err.message;
    }
  }
}
