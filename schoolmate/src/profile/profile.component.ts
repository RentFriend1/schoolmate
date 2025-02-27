import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { FormsModule } from '@angular/forms';

interface UserDetails {
  school?: string;
  schoolYear?: string;
  fieldOfStudy?: string;
  [key: string]: any;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  userData: any = null; // Holds user authentication data
  userDetails: UserDetails | null = null; // Observable for Firestore user details

  school: string = '';
  schoolYear: string = '';
  fieldOfStudy: string = '';

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
        this.userDetails = userDocSnap.data() as UserDetails;
        this.school = this.userDetails.school || '';
        this.schoolYear = this.userDetails.schoolYear || '';
        this.fieldOfStudy = this.userDetails.fieldOfStudy || '';
      } else {
        console.warn("User details not found in Firestore.");
      }
    } else {
      console.warn("No authenticated user found.");
    }
  }

  async saveUserDetails() {
    if (this.userData) {
      const userDocRef = doc(this.firestore, `users/${this.userData.uid}`);
      await setDoc(userDocRef, {
        school: this.school,
        schoolYear: this.schoolYear,
        fieldOfStudy: this.fieldOfStudy
      }, { merge: true });
      console.log("User details saved successfully.");
    } else {
      console.warn("No authenticated user found.");
    }
  }

  formatKey(key: string): string {
    switch (key) {
      case 'school':
        return 'School';
      case 'schoolYear':
        return 'School Year';
      case 'fieldOfStudy':
        return 'Field of Study';
      default:
        return key;
    }
  }
}
