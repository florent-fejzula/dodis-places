import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from 'src/app/auth/auth.service';
import { RecipesService } from 'src/app/services/recipes.service';
import { RemindersService } from 'src/app/services/reminders.service';
import { MobileNavService } from 'src/app/services/mobile-nav.service';
import { ReminderSettings, REMINDER_FREQUENCIES } from 'src/app/models/reminders';
import { Recipe } from 'src/app/models/recipes';
import { slugify } from 'src/app/utils/general.util';

interface CategoryRow {
  category: string;
  frequencyDays: number | null;
  recipeCount: number;
}

@Component({
  selector: 'app-recipe-reminders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recipe-reminders.component.html',
  styleUrls: ['./recipe-reminders.component.scss'],
})
export class RecipeRemindersComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private auth = inject(AuthService);
  private recipesSvc = inject(RecipesService);
  private mobileNav = inject(MobileNavService);
  remindersSvc = inject(RemindersService);

  readonly frequencies = REMINDER_FREQUENCIES;

  private recipes = signal<Recipe[]>([]);
  private settings = signal<ReminderSettings[]>([]);
  loaded = signal(false);

  permission = signal(this.remindersSvc.permissionState());
  /** At least one device has actually completed registration (a token is on file) - not just OS permission. */
  deviceRegistered = signal(false);
  enabling = signal(false);
  /** Per-category "sending a test" state, keyed by category */
  testingCategory = signal<string | null>(null);
  toast = signal<string>('');

  private subs = new Subscription();
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  rows = computed<CategoryRow[]>(() => {
    const byCategory = new Map<string, number>();
    for (const r of this.recipes()) {
      const cat = (r.category || 'Other').trim() || 'Other';
      byCategory.set(cat, (byCategory.get(cat) ?? 0) + 1);
    }

    const settingsBySlug = new Map(this.settings().map((s) => [slugify(s.category), s]));

    return [...byCategory.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([category, recipeCount]) => ({
        category,
        recipeCount,
        frequencyDays: settingsBySlug.get(slugify(category))?.frequencyDays ?? null,
      }));
  });

  ngOnInit() {
    this.remindersSvc.listenForForegroundPushes();
    this.mobileNav.setPage('Reminders');

    const uid = this.auth.user()?.uid;
    if (!uid) return;

    this.subs.add(
      this.recipesSvc.getRecipes(uid).subscribe((list) => {
        this.recipes.set(list ?? []);
        this.loaded.set(true);
      })
    );
    this.subs.add(
      this.remindersSvc.settings$(uid).subscribe((list) => this.settings.set(list ?? []))
    );

    this.remindersSvc
      .countRegisteredDevices(uid)
      .then((n) => this.deviceRegistered.set(n > 0))
      .catch(() => {});
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.mobileNav.clear();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  back() {
    this.router.navigate(['/recipes']);
  }

  async onFrequencyChange(category: string, value: string) {
    const uid = this.auth.user()?.uid;
    if (!uid) return;
    const days = value ? Number(value) : null;
    await this.remindersSvc.setFrequency(uid, category, days);
    this.showToast(
      days ? `Reminders set for ${category}` : `Reminders off for ${category}`
    );
  }

  async enableNotifications() {
    const uid = this.auth.user()?.uid;
    if (!uid || this.enabling()) return;

    this.enabling.set(true);
    try {
      await this.remindersSvc.enableForDevice(uid);
      // Only now - after a token has actually been written - is this device
      // really done. Setting this from OS permission alone (previously the
      // bug here) showed "on" even when registration itself had failed.
      this.permission.set(this.remindersSvc.permissionState());
      this.deviceRegistered.set(true);
      this.showToast('Notifications enabled on this device');
    } catch (err) {
      this.permission.set(this.remindersSvc.permissionState());
      console.error('Failed to enable notifications', err);
      const code = (err as any)?.code;
      const message = err instanceof Error ? err.message : 'Something went wrong';
      this.showToast(code ? `${message} (${code})` : message, 6000);
    } finally {
      this.enabling.set(false);
    }
  }

  async sendTest(category: string) {
    if (this.testingCategory()) return;
    this.testingCategory.set(category);
    try {
      const recipeName = await this.remindersSvc.sendTestReminder(category);
      this.showToast(`Sent: "${recipeName}"`);
    } catch (err: any) {
      this.showToast(err?.message ?? 'Could not send a test reminder');
    } finally {
      this.testingCategory.set(null);
    }
  }

  private showToast(message: string, ms = 3500) {
    this.toast.set(message);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(''), ms);
  }
}
