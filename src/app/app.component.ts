import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import {
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
  ActivatedRoute,
} from '@angular/router';
import { AdminService } from './services/admin.service'; // adjust path if needed
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private adminService = inject(AdminService);
  auth = inject(AuthService);

  isAdmin = this.adminService.isAdmin;

  async ngOnInit(): Promise<void> {
    await this.adminService.initRealtimeAdminMode(this.route);
  }

  ngOnDestroy(): void {
    this.adminService.cleanup();
  }

  disableAdmin() {
    localStorage.removeItem('isAdmin');
    this.isAdmin.set(false);
  }

  logout() {
    this.auth.logout();
  }
}
