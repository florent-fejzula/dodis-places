import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, signal } from '@angular/core';
type NavigatorStandalone = Navigator & { standalone?: boolean };
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

  /**
   * True once installed and launched as its own app (the Recipes PWA),
   * rather than opened as a normal browser tab. The installed app is
   * scoped to /recipes (see manifest.webmanifest), so any link outside
   * that — Home, My Lists, Places admin tools — would just kick the
   * visitor out into a regular browser window. Hiding them here keeps
   * the installed app feeling like a dedicated Recipes app.
   */
  isStandalone = signal(this.detectStandalone());

  constructor() {
    // A route change always closes the menu (back button included)
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.closeMenu());

    // display-mode can flip without a reload (e.g. install while the tab is open)
    window
      .matchMedia?.('(display-mode: standalone)')
      .addEventListener?.('change', () => this.isStandalone.set(this.detectStandalone()));
  }

  private detectStandalone(): boolean {
    return (
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (navigator as NavigatorStandalone).standalone === true
    );
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
