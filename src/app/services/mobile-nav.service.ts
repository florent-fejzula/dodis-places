import { Injectable, signal } from '@angular/core';

/** An action the current page contributes to the mobile side menu. */
export interface MobileNavAction {
  label: string;
  run: () => void;
}

/**
 * Lets a page hand its title and its header buttons to the mobile top bar,
 * so on small screens only the title stays visible and everything else
 * lives inside the slide-in menu.
 */
@Injectable({ providedIn: 'root' })
export class MobileNavService {
  readonly title = signal<string>('');
  readonly actions = signal<readonly MobileNavAction[]>([]);

  setPage(title: string, actions: readonly MobileNavAction[] = []) {
    this.title.set(title);
    this.actions.set(actions);
  }

  clear() {
    this.title.set('');
    this.actions.set([]);
  }
}
