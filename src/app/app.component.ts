import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, ActivatedRoute } from '@angular/router';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  isAdmin = false;

  constructor(private route: ActivatedRoute, private firestore: Firestore) {}

  async ngOnInit(): Promise<void> {
    try {
      // Read Firestore admin flag
      const configRef = doc(this.firestore, 'config', 'settings');
      const snap = await getDoc(configRef);
      const data = snap.data();

      // Check URL and local storage
      const urlAdmin = this.route.snapshot.queryParamMap.get('admin') === '1';
      const urlAdminOff = this.route.snapshot.queryParamMap.get('admin') === '0';
      const savedAdmin = localStorage.getItem('isAdmin') === 'true';

      if (urlAdmin) {
        localStorage.setItem('isAdmin', 'true');
        this.isAdmin = true;
      } else if (urlAdminOff) {
        localStorage.removeItem('isAdmin');
        this.isAdmin = false;
      } else {
        this.isAdmin = (data && data['adminMode']) || savedAdmin;
      }
    } catch (err) {
      console.error('Error checking admin mode:', err);
      this.isAdmin = false;
    }
  }
}
