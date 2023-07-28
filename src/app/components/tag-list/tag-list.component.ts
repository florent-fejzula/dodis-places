import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-tag-list',
  templateUrl: './tag-list.component.html',
  styleUrls: ['./tag-list.component.scss']
})
export class TagListComponent {

  @Input() tags: string[] = [];
  @Output() tagClicked: EventEmitter<string> = new EventEmitter<string>();

  onTagClicked(selectedTag: string) {
    this.tagClicked.emit(selectedTag);
  }

}
