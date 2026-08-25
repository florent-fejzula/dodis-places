import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, switchMap } from 'rxjs';

import { Place } from 'src/app/models/places';
import { locationTags } from 'src/app/models/tags';
import { AuthService } from 'src/app/auth/auth.service';
import { AdminService } from 'src/app/services/admin.service';
import { FavoritesService } from 'src/app/services/favorites.service';
import { MobileNavService } from 'src/app/services/mobile-nav.service';
import { PlacesService } from 'src/app/services/places.service';
import { findPlaceBySlug, slugify } from 'src/app/utils/general.util';

@Component({
  selector: 'app-place-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './place-detail.component.html',
  styleUrls: ['./place-detail.component.scss'],
})
export class PlaceDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private svc = inject(PlacesService);
  private favs = inject(FavoritesService);
  private auth = inject(AuthService);
  private mobileNav = inject(MobileNavService);

  isAdmin = inject(AdminService).isAdmin;

  place = signal<Place | null>(null);
  loading = signal(true);
  notFound = signal(false);

  activeImage = signal<string | null>(null);
  isFavorite = signal(false);
  toast = signal<string>('');

  private sub?: Subscription;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  private slug = '';

  ngOnInit(): void {
    this.sub = this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.slug = params.get('slug') ?? '';
          this.loading.set(true);
          this.notFound.set(false);
          return this.svc.getPlaces();
        })
      )
      .subscribe((places) => {
        const match = findPlaceBySlug(places ?? [], this.slug);
        this.loading.set(false);

        if (!match) {
          this.notFound.set(true);
          this.place.set(null);
          return;
        }

        this.place.set(match);
        this.mobileNav.setPage(match.name);

        // Keep the photo the user is looking at across live updates
        const photos = this.gallery();
        const current = this.activeImage();
        if (!current || !photos.includes(current)) {
          this.activeImage.set(photos[0] ?? null);
        }

        this.refreshFavorite();
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.mobileNav.clear();
  }

  /** Primary photo first, then the rest, without duplicates. */
  gallery(): string[] {
    const p = this.place();
    if (!p) return [];
    const urls = [p.imagePrimaryUrl, ...(p.images ?? []).map((i) => i.url)];
    return urls.filter((u): u is string => !!u).filter((u, i, all) => all.indexOf(u) === i);
  }

  neighborhood(): string | null {
    return this.place()?.tags?.find((t) => locationTags.includes(t)) ?? null;
  }

  otherTags(): string[] {
    return (this.place()?.tags ?? []).filter((t) => !locationTags.includes(t));
  }

  back() {
    // history.back keeps the Explore filters; direct visits get a sane target
    if (window.history.length > 1) window.history.back();
    else this.router.navigate(['/places']);
  }

  openInMaps() {
    const p = this.place();
    if (!p) return;
    const url =
      p.gmapsUrl || `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`;
    window.open(url, '_blank', 'noopener');
  }

  directionsUrl(): string {
    const p = this.place();
    if (!p) return '';
    return `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;
  }

  async share() {
    const p = this.place();
    if (!p) return;

    const url = `${location.origin}/place/${slugify(p.name)}`;
    const data = {
      title: p.name,
      text: p.description || `${p.name} — Skopje`,
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(data);
        return;
      }
      await navigator.clipboard.writeText(url);
      this.showToast('Link copied');
    } catch {
      // user dismissed the share sheet, or the clipboard was blocked
      this.showToast(url);
    }
  }

  async toggleFavorite() {
    const p = this.place();
    if (!p) return;

    if (!this.auth.user()) {
      this.showToast('Log in to save your favourites');
      return;
    }

    await this.favs.toggleFavorite(p);
    await this.refreshFavorite();
  }

  goEdit() {
    const p = this.place();
    if (p?.id) this.router.navigate(['/admin/add-place', p.id]);
  }

  private async refreshFavorite() {
    const p = this.place();
    if (!p?.id || !this.auth.user()) {
      this.isFavorite.set(false);
      return;
    }
    const list = await this.favs.getFavorites();
    this.isFavorite.set(list.includes(p.id));
  }

  private showToast(message: string) {
    this.toast.set(message);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(''), 2500);
  }
}
