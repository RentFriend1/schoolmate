import { Injectable, NgZone } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, UserCredential } from '@angular/fire/auth';
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


  //SetUserData(user: any) {
  //  const userRef: AngularFirestoreDocument<any> = this.afs.doc(
  //    users / ${ user.uid }
  //  );

  //  const userData = {
  //    uid: user.uid,
  //    email: user.email,
  //    displayName: user.displayName,
  //    photoURL: user.photoURL,
  //    emailVerified: user.emailVerified,
  //    role: 'user',
  //  };

  //  return userRef
  //    .set(userData, { merge: true })
  //    .then(() => {
  //      console.log('Document written successfully!');
  //    })
  //    .catch((error) => {
  //      console.error('Error writing document: ', error);
  //    });
  //}
   
   GoogleAuthPopup(): Promise<void> {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(this.auth, provider)
      .then((result: UserCredential) => {
        this.ngZone.run(() => {
          this.router.navigate(['homepage']); // Redirect after login
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
