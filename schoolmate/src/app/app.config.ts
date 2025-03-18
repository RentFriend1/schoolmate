import { Route, provideRouter } from '@angular/router';
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';

// Firebase imports
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { setPersistence, browserSessionPersistence, browserLocalPersistence } from 'firebase/auth'; // Import both, choose one
import { getAuth, provideAuth } from '@angular/fire/auth'
import { provideAnalytics, getAnalytics } from '@angular/fire/analytics';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideStorage, getStorage } from '@angular/fire/storage';

// Standalone components
import { SigninComponent } from '../signin/signin.component';
import { MaterialsComponent } from '../materials/materials.component';
import { HomepageComponent } from '../homepage/homepage.component';
import { NoticeComponent } from '../notice/notice.component';
import { ProfileComponent } from '../profile/profile.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { PostDescriptionComponent } from '../post-description/post-description.component'; // Import PostDescriptionComponent
import { authGuard } from '../authguard/auth.guard';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

export const environment = {
  apiKey: "AIzaSyA5KkP_tkUvrpbYJjtGnssQYr3atcZZn8s",
  authDomain: "schoolmate-80431.firebaseapp.com",
  projectId: "schoolmate-80431",
  storageBucket: "schoolmate-80431.appspot.com",
  messagingSenderId: "380409970145",
  appId: "1:380409970145:web:f47153c2a00be1640b66a0",
  measurementId: "G-NT31QVX0E5"
};

const routes: Route[] = [
  { path: '', component: SigninComponent, pathMatch: 'full' },
  { path: 'signin', component: SigninComponent, pathMatch: 'full' },
  { path: 'homepage', component: HomepageComponent, pathMatch: 'full', canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, pathMatch: 'full', canActivate: [authGuard] },
  { path: 'materials', component: MaterialsComponent, pathMatch: 'full', canActivate: [authGuard] },
  { path: 'notice', component: NoticeComponent, pathMatch: 'full' },
  { path: 'post/:id', component: PostDescriptionComponent }, // Add route for PostDescriptionComponent
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideFirebaseApp(() => initializeApp(environment)),
    provideAuth(() => {
      const auth = getAuth();

      // Choose ONE persistence type:
      setPersistence(auth, browserLocalPersistence)  //  <-- CORRECT USAGE: Local Persistence
        // OR
        // setPersistence(auth, browserSessionPersistence) //<-- CORRECT USAGE: Session Persistence
        .then(() => {
          console.log("Persistence is set.");
        })
        .catch((error) => {
          console.error("Error setting persistence:", error);
        });
      return auth;
    }),
    provideAnalytics(() => getAnalytics()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()), provideAnimationsAsync()
  ]
};
