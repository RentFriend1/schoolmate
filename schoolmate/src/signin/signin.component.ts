import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-signin',
  standalone: true,
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
  signInRedirect() {
    this.authService.GoogleAuthRedirect();
  }
}
