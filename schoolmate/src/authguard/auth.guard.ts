import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth.service'; // Import AuthService

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService); // Inject AuthService
  const router = inject(Router);

  if (authService.isLoggedIn) { // Use authService.isLoggedIn
    console.log('authGuard - User is authenticated, allowing access');
    return true;
  } else {
    console.log('authGuard - User is NOT authenticated, redirecting to /signin');
    router.navigate(['/signin']);
    return false;
  }
};
