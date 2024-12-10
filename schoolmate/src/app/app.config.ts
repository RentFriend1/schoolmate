import { Route, provideRouter } from '@angular/router';
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';

// Firebase imports
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideAnalytics, getAnalytics } from '@angular/fire/analytics';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideStorage, getStorage } from '@angular/fire/storage';

// Standalone components
import { AppComponent } from './app.component';
import { SigninComponent } from '../signin/signin.component';
import { HomepageComponent } from '../homepage/homepage.component';

export const enviroment = {
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
  { path: 'homepage', component: HomepageComponent, pathMatch: 'full' }
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideFirebaseApp(() => initializeApp(enviroment)),
    provideAuth(() => getAuth()),
    provideAnalytics(() => getAnalytics()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage())
  ]
};
