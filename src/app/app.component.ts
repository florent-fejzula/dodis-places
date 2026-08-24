import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, signal } from '@angular/core';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter } from 'rxjs';
import { AdminService } from './services/admin.service';
import {
  MobileNavAction,
  MobileNavService,
} from './services/mobile-nav.service';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  private adminService = inject(AdminService);
  private router = inject(Router);
  auth = inject(AuthService);
  mobileNav = inject(MobileNavService);

  isAdmin = this.adminService.isAdmin;

  /** Mobile side menu */
  menuOpen = signal(false);

  constructor() {
    // A route change always closes the menu (back button included)
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.closeMenu());
  }

  toggleMenu() {
    this.menuOpen() ? this.closeMenu() : this.openMenu();
  }

  openMenu() {
    this.menuOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeMenu() {
    if (!this.menuOpen()) return;
    this.menuOpen.set(false);
    document.body.style.overflow = '';
  }

  runAction(action: MobileNavAction) {
    this.closeMenu();
    action.run();
  }

  logoutFromMenu() {
    this.closeMenu();
    this.logout();
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.closeMenu();
  }

  logout() {
    this.auth.logout();
  }
}
