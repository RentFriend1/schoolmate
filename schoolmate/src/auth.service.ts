import { Injectable, NgZone } from '@angular/core';
//import * as auth from 'firebase/auth';
import { Auth } from '@angular/fire/auth';
//import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { Observable, from, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';



export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  userData: any;

  constructor(
    //public afs: AngularFirestore,
    public afAuth: Auth,
    public router: Router,
    public ngZone: NgZone,
    //private firestore: AngularFirestore,
    private http: HttpClient
  ) {
    /*this.afAuth.authState.subscribe((user) => {
      if (user) {
        this.userData = user;
        localStorage.setItem('user', JSON.stringify(this.userData));
      } else {
        localStorage.setItem('user', 'null');
      }
    });*/
  }
  get isLoggedIn(): boolean {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user !== null;
  }

  GoogleAuth() {
    return signInWithPopup(this.afAuth, new GoogleAuthProvider());
    //return this.afAuth.signInWithPopup(new GoogleAuthProvider());
    /*return this.AuthLogin(new auth.GoogleAuthProvider()).then((res: any) => {
      this.router.navigate(['dashboard']);
    });*/
  }

  /*AuthLogin(provider: any) {
    return this.afAuth
      .signInWithPopup(provider)
      .then((result) => {
        this.router.navigate(['dashboard']);
        //this.SetUserData(result.user);
      })
      .catch((error) => {
        window.alert(error);
      });
  }*/

  /*SetUserData(user: any) {
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(
      'users / ${  user.uid }'
    );

    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
    };

    return userRef
      .set(userData, { merge: true })
      .then(() => {
        console.log('Document written successfully!');
      })
      .catch((error) => {
        console.error('Error writing document: ', error);
      });
  }
  */
  SignOut() {
    return this.afAuth.signOut().then(() => {
      localStorage.removeItem('user');
      this.router.navigate(['']);
    });
  }
}

