import { Injectable, NgZone } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, User, UserCredential } from '@angular/fire/auth';
import { Router } from '@angular/router';

interface UserData { // Define UserData interface
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  // Add other properties as needed
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  userData: UserData | null = null; // Holds logged-in user data

  constructor(
    private auth: Auth, // Modern Firebase Auth Service
    private router: Router,
    private ngZone: NgZone
  ) {
    this.auth.onAuthStateChanged((user) => {
      if (user) {
        this.userData = this.getUserData(user);
        sessionStorage.setItem('user', JSON.stringify(this.userData));
      } else {
        this.userData = null;
        sessionStorage.removeItem('user');
      }
    });
  }

  private getUserData(user: User): UserData {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    };
  }

  /**
   * Check if user is logged in
   */
  get isLoggedIn(): boolean {
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || 'null');
      return user !== null;
    } catch (error) {
      console.error('Error parsing user from sessionStorage:', error);
      return false; // Treat as not authenticated in case of error
    }
  }

  GoogleAuthPopup(): Promise<void> {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(this.auth, provider)
      .then((result: UserCredential) => {
        this.ngZone.run(() => {
          this.router.navigate(['homepage']); // Redirect after login
        });
        this.userData = this.getUserData(result.user);
        sessionStorage.setItem('user', JSON.stringify(this.userData));
      })
      .catch((error) => {
        console.error('Google Auth Error:', error);
        // Display an error message to the user (e.g., using a toast or alert)
        alert('Google authentication failed. Please try again.');
      });
  }

  /**
   * Sign Out
   */
  SignOut(): Promise<void> {
    return this.auth.signOut().then(() => {
      sessionStorage.removeItem('user');
      this.router.navigate(['/signin']); // Redirect to home
    });
  }
}
