import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent {
  placeForm: FormGroup;

  constructor(private fb: FormBuilder, private firestore: Firestore) {
    this.placeForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      imageUrl: [''],
      instagram: [''],
      locationUrl: [''],
      tags: [''],
      highlightedTags: [''],
      isReferencePoint: [false],
      isHeadquarter: [false]
    });
  }

  async submitForm() {
    if (this.placeForm.invalid) return;

    const data = {
      ...this.placeForm.value,
      tags: this.stringToArray(this.placeForm.value.tags),
      highlightedTags: this.stringToArray(this.placeForm.value.highlightedTags)
    };

    const placesRef = collection(this.firestore, 'places');
    await addDoc(placesRef, data);
    alert('Place added!');
    this.placeForm.reset();
  }

  private stringToArray(input: string): string[] {
    return input.split(',').map(tag => tag.trim()).filter(Boolean);
  }
}
