import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';

interface UserDetails {
  school?: string;
  schoolYear?: string;
  fieldOfStudy?: string;
  userTypeRole?: string;
  subjectsTaught?: string;
  cabinetName?: string;
  [key: string]: any;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  animations: [
    trigger('slideToggle', [
      state('void', style({ height: '0px', overflow: 'hidden' })),
      state('*', style({ height: '*' })),
      transition('void <=> *', animate('300ms ease-in-out'))
    ])
  ]
})
export class ProfileComponent implements OnInit {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  userData: any = null; // Holds user authentication data
  userDetails: UserDetails | null = null; // Observable for Firestore user details
  showEditForm: boolean = false; // Controls the visibility of the edit form

  // Temporary object to hold form data
  formData: UserDetails = {
    school: '',
    schoolYear: '',
    fieldOfStudy: '',
    userTypeRole: 'student',
    subjectsTaught: '',
    cabinetName: '',
    field: ''
  };

  async ngOnInit() {
    const currentUser = this.auth.currentUser;

    if (currentUser) {
      this.userData = {
        displayName: currentUser.displayName,
        email: currentUser.email,
        photoURL: currentUser.photoURL,
        uid: currentUser.uid
      };

      await this.fetchUserDetails(currentUser.uid);
    } else {
      console.warn("No authenticated user found.");
    }
  }

  async fetchUserDetails(uid: string) {
    const userDocRef = doc(this.firestore, `users/${uid}`);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      this.userDetails = userDocSnap.data() as UserDetails;
      this.formData = { ...this.userDetails }; // Copy user details to form data
    } else {
      console.warn("User details not found in Firestore.");
    }
  }

  async saveUserDetails(event: Event) {
    event.preventDefault(); // Prevent the default form submission behavior
    if (this.userData) {
      const userDocRef = doc(this.firestore, `users/${this.userData.uid}`);
      await setDoc(userDocRef, this.formData, { merge: true });
      console.log("User details saved successfully.");
      await this.fetchUserDetails(this.userData.uid); // Re-fetch user details after saving
    } else {
      console.warn("No authenticated user found.");
    }
  }

  toggleEdit() {
    this.showEditForm = !this.showEditForm;
  }

  formatKey(key: string): string {
    switch (key) {
      case 'school':
        return 'School';
      case 'schoolYear':
        return 'School Year';
      case 'fieldOfStudy':
        return 'Field of Study';
      case 'userTypeRole':
        return 'User Type and Role';
      case 'subjectsTaught':
        return 'Subjects Taught';
      case 'cabinetName':
        return 'Cabinet Name';
      case 'field':
        return 'Field';
      default:
        return key;
    }
  }
}



