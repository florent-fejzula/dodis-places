import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';

@Component({
  selector: 'app-tags-section',
  standalone: true,
  imports: [CommonModule, NgClass],
  templateUrl: './tags-section.component.html',
  styleUrls: ['./tags-section.component.scss'],
})
export class TagsSectionComponent {
  @Input() locationTags: string[] = [];
  @Input() vibeTags: string[] = [];
  @Input() stuffTags: string[] = [];

  @Input() selectedTags: string[] = [];
  @Input() disabledTags: Set<string> | null = null;

  @Output() tagClicked = new EventEmitter<string>();
  @Output() clearClicked = new EventEmitter<void>();

  isTagSelected(tag: string): boolean {
    return this.selectedTags?.includes(tag);
  }

  isTagDisabled(tag: string): boolean {
    // Already-selected tags are never disabled (so they can be unselected)
    if (this.isTagSelected(tag)) return false;
    return !!this.disabledTags?.has(tag);
  }

  onTagClicked(tag: string) {
    if (!this.isTagDisabled(tag)) this.tagClicked.emit(tag);
  }

  clearSelectedTags() {
    this.clearClicked.emit();
  }
}
