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
  updateProfile,
  sendPasswordResetEmail,
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
} from '@angular/fire/firestore';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private db = inject(Firestore);
  private router = inject(Router);

  // 🔹 Firebase Auth user
  user = signal<User | null>(null);

  // 🔹 Firestore user data (username, favorites, etc.)
  userData = signal<any | null>(null);

  loading = signal(true);

  constructor() {
    onAuthStateChanged(this.auth, async (usr) => {
      this.user.set(usr);
      this.loading.set(false);

      if (usr) {
        const ref = doc(this.db, 'users', usr.uid);
        const snap = await getDoc(ref);

        // Create missing user doc
        if (!snap.exists()) {
          await setDoc(ref, {
            email: usr.email,
            username: usr.displayName || usr.email?.split('@')[0],
            createdAt: serverTimestamp(),
            favorites: [],
          });
        }

        // 🔁 Live Firestore sync
        onSnapshot(ref, (snapshot) => {
          this.userData.set(snapshot.data());
        });
      } else {
        this.userData.set(null);
      }
    });
  }

  // --- 🔹 EMAIL LOGIN
  async loginWithEmail(email: string, password: string) {
    try {
      const cred = await signInWithEmailAndPassword(this.auth, email, password);
      await this.router.navigate(['/places']);
      return cred;
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  }

  // --- 🔹 GOOGLE LOGIN
  async loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(this.auth, provider);
      const user = cred.user;

      const ref = doc(this.db, 'users', user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          email: user.email,
          username: user.displayName || user.email?.split('@')[0],
          createdAt: serverTimestamp(),
          favorites: [],
        });
      }

      await this.router.navigate(['/places']);
    } catch (err) {
      console.error('Google login error:', err);
      throw err;
    }
  }

  // --- 🔹 EMAIL SIGNUP
  async signUpWithEmail(email: string, password: string, username?: string) {
    try {
      const cred = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      const user = cred.user;

      // Update display name in Firebase Auth
      if (username) {
        await updateProfile(user, { displayName: username });
      }

      const ref = doc(this.db, 'users', user.uid);
      await setDoc(ref, {
        email: user.email,
        username: username || user.email?.split('@')[0],
        createdAt: serverTimestamp(),
        favorites: [],
      });

      await this.router.navigate(['/places']);
    } catch (err) {
      console.error('Signup error:', err);
      throw err;
    }
  }

  // --- 🔹 PASSWORD RESET
  async resetPassword(email: string) {
    if (!email) throw new Error('Please enter your email.');
    try {
      await sendPasswordResetEmail(this.auth, email);
      return true;
    } catch (err: any) {
      console.error('Password reset error:', err);
      throw err;
    }
  }

  // --- 🔹 LOGOUT
  async logout() {
    try {
      await signOut(this.auth);
      this.userData.set(null);
      await this.router.navigate(['/login']);
    } catch (err) {
      console.error('Logout error:', err);
      throw err;
    }
  }
}
