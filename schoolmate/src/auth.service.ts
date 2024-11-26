import { Injectable, NgZone } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, UserCredential,  } from '@angular/fire/auth';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  userData: any; // Holds logged-in user data

  constructor(
    private auth: Auth, // Modern Firebase Auth Service
    private router: Router,
    private ngZone: NgZone
  ) {
    // Monitor auth state and update localStorage
    this.auth.onAuthStateChanged((user) => {
      if (user) {
        this.userData = user;
        localStorage.setItem('user', JSON.stringify(this.userData));
      } else {
        localStorage.removeItem('user');
      }
    });
  }

  /**
   * Check if user is logged in
   */
  get isLoggedIn(): boolean {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user !== null;
  }

  /**
   * Google Sign-In
   */
  GoogleAuth(): Promise<void> {
    const provider = new GoogleAuthProvider();
    return signInWithRedirect(this.auth, provider)
      .then((result: UserCredential) => {
        this.ngZone.run(() => {
          this.router.navigate(['dashboard']); // Redirect after login
        });
        this.userData = result.user;
        localStorage.setItem('user', JSON.stringify(this.userData));
      })
      .catch((error) => {
        console.error('Google Auth Error:', error);
      });
  }

  /**
   * Sign Out
   */
  SignOut(): Promise<void> {
    return this.auth.signOut().then(() => {
      localStorage.removeItem('user');
      this.router.navigate(['']); // Redirect to home
    });
  }
}
