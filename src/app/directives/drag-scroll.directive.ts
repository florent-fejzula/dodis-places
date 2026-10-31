import {
  AfterViewInit,
  Directive,
  ElementRef,
  NgZone,
  OnDestroy,
  inject,
} from '@angular/core';

/**
 * A horizontal strip (e.g. the category chips) that can be dragged sideways
 * with the mouse, and scrolled with an ordinary vertical mouse wheel. Touch
 * already swipes natively, so only mouse pointers are handled.
 *
 * It also marks its parent with `more-left` / `more-right` while there is
 * hidden content on that side, so the parent can show edge fades only
 * where there is actually more to see.
 */
@Directive({ selector: '[appDragScroll]', standalone: true })
export class DragScrollDirective implements AfterViewInit, OnDestroy {
  private el: HTMLElement = inject(ElementRef).nativeElement;
  private zone = inject(NgZone);

  private pointerId: number | null = null;
  private startX = 0;
  private startScroll = 0;
  private dragged = false;
  private observers: (ResizeObserver | MutationObserver)[] = [];
  private unlisten: (() => void)[] = [];

  ngAfterViewInit() {
    // None of this touches app state, so keep it from triggering change detection
    this.zone.runOutsideAngular(() => {
      this.listen('pointerdown', (e) => this.onDown(e as PointerEvent));
      this.listen('pointermove', (e) => this.onMove(e as PointerEvent));
      this.listen('pointerup', (e) => this.onUp(e as PointerEvent));
      this.listen('pointercancel', (e) => this.onUp(e as PointerEvent));
      // Capture phase: a drag must not end as a click on the chip under the mouse
      this.listen('click', (e) => this.swallowClickAfterDrag(e), { capture: true });
      this.listen('wheel', (e) => this.onWheel(e as WheelEvent), { passive: false });
      this.listen('scroll', () => this.updateEdges(), { passive: true });

      // Width changes, and chips arriving once the recipes load
      const resize = new ResizeObserver(() => this.updateEdges());
      resize.observe(this.el);
      const mutation = new MutationObserver(() => this.updateEdges());
      mutation.observe(this.el, { childList: true, subtree: true, characterData: true });
      this.observers.push(resize, mutation);

      this.updateEdges();
    });
  }

  ngOnDestroy() {
    this.unlisten.forEach((off) => off());
    this.observers.forEach((o) => o.disconnect());
  }

  private listen(type: string, fn: (e: Event) => void, opts?: AddEventListenerOptions) {
    this.el.addEventListener(type, fn, opts);
    this.unlisten.push(() => this.el.removeEventListener(type, fn, opts));
  }

  private get maxScroll() {
    return this.el.scrollWidth - this.el.clientWidth;
  }

  private onDown(e: PointerEvent) {
    if (e.pointerType !== 'mouse' || e.button !== 0 || this.maxScroll <= 0) return;
    this.pointerId = e.pointerId;
    this.startX = e.clientX;
    this.startScroll = this.el.scrollLeft;
    this.dragged = false;
  }

  private onMove(e: PointerEvent) {
    if (e.pointerId !== this.pointerId) return;
    const dx = e.clientX - this.startX;
    // A few pixels of slack, so a slightly shaky click still counts as a click
    if (!this.dragged && Math.abs(dx) < 5) return;

    if (!this.dragged) {
      this.dragged = true;
      this.el.setPointerCapture(e.pointerId);
      this.el.classList.add('dragging');
    }
    this.el.scrollLeft = this.startScroll - dx;
  }

  private onUp(e: PointerEvent) {
    if (e.pointerId !== this.pointerId) return;
    this.pointerId = null;
    this.el.classList.remove('dragging');
    // Browsers release capture after pointerup on their own; doing it here
    // too costs nothing and guarantees later clicks reach the chips again
    if (this.el.hasPointerCapture(e.pointerId)) {
      this.el.releasePointerCapture(e.pointerId);
    }
    // The click (if any) fires right after pointerup; forget the drag after that
    setTimeout(() => (this.dragged = false));
  }

  private swallowClickAfterDrag(e: Event) {
    if (!this.dragged) return;
    e.stopPropagation();
    e.preventDefault();
    this.dragged = false;
  }

  private onWheel(e: WheelEvent) {
    // Trackpads already scroll sideways; only translate a plain vertical wheel
    if (Math.abs(e.deltaX) >= Math.abs(e.deltaY) || this.maxScroll <= 0) return;
    const step = e.deltaMode === WheelEvent.DOM_DELTA_LINE ? e.deltaY * 16 : e.deltaY;
    this.el.scrollLeft += step;
    e.preventDefault();
  }

  private updateEdges() {
    const parent = this.el.parentElement;
    if (!parent) return;
    const max = this.maxScroll;
    parent.classList.toggle('more-left', this.el.scrollLeft > 1);
    parent.classList.toggle('more-right', max > 1 && this.el.scrollLeft < max - 1);
  }
}
