import { Injectable, inject, signal } from '@angular/core';
import {
  Auth,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  User,
} from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private db = inject(Firestore);

  user = signal<User | null>(null);
  loading = signal(true);

  constructor() {
    onAuthStateChanged(this.auth, async (usr) => {
      this.user.set(usr);
      this.loading.set(false);
      if (usr) {
        const ref = doc(this.db, 'users', usr.uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          await setDoc(ref, { email: usr.email, createdAt: new Date() });
        }
      }
    });
  }

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(this.auth, provider);
  }

  async loginWithEmail(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  async signUpWithEmail(email: string, password: string) {
    const userCred = await createUserWithEmailAndPassword(
      this.auth,
      email,
      password
    );
    const user = userCred.user;
    const ref = doc(this.db, 'users', user.uid);
    await setDoc(ref, {
      email: user.email,
      createdAt: new Date(),
      favorites: [],
    });
  }

  logout() {
    return signOut(this.auth);
  }
}
