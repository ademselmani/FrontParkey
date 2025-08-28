import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register-step1',
  templateUrl: './register-step1.component.html'
})
export class RegisterStep1Component {
  firstName = '';
  lastName = '';

  constructor(private router: Router) {}

  nextStep() {
    const user = {
      firstName: this.firstName,
      lastName: this.lastName
    };
    localStorage.setItem('user', JSON.stringify(user));
    this.router.navigate(['/step2']);
  }
}
