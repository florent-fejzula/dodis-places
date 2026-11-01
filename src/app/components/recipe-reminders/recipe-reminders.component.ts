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
import { Recipe, RecipeShare, compareCategories } from 'src/app/models/recipes';
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

  // ---- Sharing
  share = signal<RecipeShare | null>(null);
  shareLoaded = signal(false);
  sharingBusy = signal(false);
  /** The name visitors see ("<name>'s Recipes"); also becomes the link. */
  shareName = '';
  readonly canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  shareUrl = computed(() => {
    const s = this.share();
    return s ? `${location.origin}/recipes/${s.handle}` : '';
  });

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
      .sort((a, b) => compareCategories(a[0], b[0]))
      .map(([category, recipeCount]) => ({
        category,
        recipeCount,
        frequencyDays: settingsBySlug.get(slugify(category))?.frequencyDays ?? null,
      }));
  });

  ngOnInit() {
    this.remindersSvc.listenForForegroundPushes();
    this.mobileNav.setPage('Settings');

    const uid = this.auth.user()?.uid;
    if (!uid) return;

    this.shareName = this.guessName();
    this.recipesSvc
      .getMyShare(uid)
      .then((s) => this.share.set(s))
      .catch(() => {})
      .finally(() => this.shareLoaded.set(true));

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

  /** A first guess at the name to show visitors; editable before sharing. */
  private guessName(): string {
    const username = this.auth.userData()?.username as string | undefined;
    const user = this.auth.user();
    const raw = username || user?.displayName || user?.email?.split('@')[0] || '';
    // "jane.doe_99" -> "Jane Doe"
    return raw
      .split(/[._\-\d]+/)
      .filter(Boolean)
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(' ');
  }

  async toggleSharing() {
    const uid = this.auth.user()?.uid;
    if (!uid || this.sharingBusy()) return;

    this.sharingBusy.set(true);
    try {
      if (this.share()) {
        await this.recipesSvc.stopSharing(uid);
        this.share.set(null);
        this.showToast('Sharing is off - the link no longer works');
      } else {
        const name = this.shareName.trim();
        if (!name) {
          this.showToast('Add a name first');
          return;
        }
        this.share.set(await this.recipesSvc.startSharing(uid, name));
        this.showToast('Sharing is on');
      }
    } catch (err) {
      console.error('Sharing toggle failed', err);
      this.showToast("Couldn't change sharing - try again", 5000);
    } finally {
      this.sharingBusy.set(false);
    }
  }

  async copyShareLink() {
    try {
      await navigator.clipboard.writeText(this.shareUrl());
      this.showToast('Link copied');
    } catch {
      this.showToast("Couldn't copy - select the link and copy it instead");
    }
  }

  async nativeShare() {
    const s = this.share();
    if (!s) return;
    try {
      await navigator.share({ title: `${s.name}'s Recipes`, url: this.shareUrl() });
    } catch {
      // closing the share sheet rejects too - nothing to report
    }
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
