import { Injectable, NgZone, signal, inject } from '@angular/core';
import { Firestore, doc, onSnapshot, getDoc } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private firestore = inject(Firestore);
  private zone = inject(NgZone);
  readonly isAdmin = signal<boolean>(false);

  private unsubscribeFn?: () => void;

  async initRealtimeAdminMode(route: ActivatedRoute): Promise<boolean> {
    const ref = doc(this.firestore, 'config', 'settings');

    // 🧠 Step 1: Get initial snapshot safely inside Angular zone
    let initialValue = false;
    try {
      const snap = await getDoc(ref);
      const data = snap.data();
      this.zone.run(() => {
        initialValue = !!(data && data['adminMode']);
      });
    } catch (err) {
      console.error('Admin init error', err);
    }

    // 🧩 Step 2: URL / localStorage override logic
    const urlParam = route.snapshot.queryParamMap.get('admin');
    const urlAdmin = urlParam === '1';
    const urlAdminOff = urlParam === '0';
    const savedAdmin = localStorage.getItem('isAdmin') === 'true';

    this.zone.run(() => {
      if (urlAdmin) {
        localStorage.setItem('isAdmin', 'true');
        this.isAdmin.set(true);
      } else if (urlAdminOff) {
        localStorage.removeItem('isAdmin');
        this.isAdmin.set(false);
      } else {
        this.isAdmin.set(initialValue || savedAdmin);
      }
    });

    // 🧠 Step 3: Start realtime listener inside Angular zone
    this.unsubscribeFn?.();
    this.unsubscribeFn = onSnapshot(ref, (snap) => {
      const data = snap.data();
      const dbValue = !!(data && data['adminMode']);
      const saved = localStorage.getItem('isAdmin') === 'true';
      this.zone.run(() => {
        if (!saved) this.isAdmin.set(dbValue);
      });
    });

    return this.isAdmin();
  }

  cleanup() {
    this.unsubscribeFn?.();
    this.unsubscribeFn = undefined;
  }
}
