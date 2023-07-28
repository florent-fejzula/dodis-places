import { Component } from '@angular/core';
import availableTags from './models/tags';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  allTags: string[] = availableTags;
}
