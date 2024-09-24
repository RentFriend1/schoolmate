import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { initializeApp as initializeApp_alias, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getAnalytics as getAnalytics_alias, provideAnalytics, ScreenTrackingService, UserTrackingService } from '@angular/fire/analytics';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getStorage, provideStorage } from '@angular/fire/storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA5KkP_tkUvrpbYJjtGnssQYr3atcZZn8s",
  authDomain: "schoolmate-80431.firebaseapp.com",
  projectId: "schoolmate-80431",
  storageBucket: "schoolmate-80431.appspot.com",
  messagingSenderId: "380409970145",
  appId: "1:380409970145:web:f47153c2a00be1640b66a0",
  measurementId: "G-NT31QVX0E5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), provideFirebaseApp(() => initializeApp({"projectId":"schoolmate-80431","appId":"1:380409970145:web:f47153c2a00be1640b66a0","storageBucket":"schoolmate-80431.appspot.com","apiKey":"AIzaSyA5KkP_tkUvrpbYJjtGnssQYr3atcZZn8s","authDomain":"schoolmate-80431.firebaseapp.com","messagingSenderId":"380409970145","measurementId":"G-NT31QVX0E5"})), provideAuth(() => getAuth()), provideAnalytics(() => getAnalytics()), ScreenTrackingService, UserTrackingService, provideFirestore(() => getFirestore()), provideStorage(() => getStorage()), provideFirebaseApp(() => initializeApp({"projectId":"schoolmate-80431","appId":"1:380409970145:web:f47153c2a00be1640b66a0","storageBucket":"schoolmate-80431.appspot.com","apiKey":"AIzaSyA5KkP_tkUvrpbYJjtGnssQYr3atcZZn8s","authDomain":"schoolmate-80431.firebaseapp.com","messagingSenderId":"380409970145","measurementId":"G-NT31QVX0E5"})), provideAuth(() => getAuth()), provideFirestore(() => getFirestore()), provideFirebaseApp(() => initializeApp({"projectId":"schoolmate-80431","appId":"1:380409970145:web:f47153c2a00be1640b66a0","storageBucket":"schoolmate-80431.appspot.com","apiKey":"AIzaSyA5KkP_tkUvrpbYJjtGnssQYr3atcZZn8s","authDomain":"schoolmate-80431.firebaseapp.com","messagingSenderId":"380409970145","measurementId":"G-NT31QVX0E5"})), provideFirestore(() => getFirestore()), provideFirebaseApp(() => initializeApp({"projectId":"schoolmate-80431","appId":"1:380409970145:web:f47153c2a00be1640b66a0","storageBucket":"schoolmate-80431.appspot.com","apiKey":"AIzaSyA5KkP_tkUvrpbYJjtGnssQYr3atcZZn8s","authDomain":"schoolmate-80431.firebaseapp.com","messagingSenderId":"380409970145","measurementId":"G-NT31QVX0E5"})), provideFirestore(() => getFirestore())]
};
