import { Component, OnInit, inject, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  userData: any = null; // Holds user authentication data
  userDetails: any = null; // Observable for Firestore user details

  async ngOnInit() {

    const currentUser = this.auth.currentUser;

      if (currentUser) {
        this.userData = {
          displayName: currentUser.displayName,
          email: currentUser.email,
          photoURL: currentUser.photoURL,
          uid: currentUser.uid
        };

        const userDocRef = doc(this.firestore, `users/${currentUser.uid}`);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          this.userDetails = userDocSnap.data();
        } else {
          console.warn("User details not found in Firestore.");
        }
      } else {
        console.warn("No authenticated user found.");
      }
      }
    ;
}
