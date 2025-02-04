import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [CommonModule], // Add CommonModule to imports
  templateUrl: './signin.component.html',
  styleUrl: './signin.component.css'
})
export class SigninComponent {
  constructor(
    public authService: AuthService
  ) { }

  signInPopup() {
    this.authService.GoogleAuthPopup();
  }

  signOut() {
    this.authService.SignOut();
  }
}
