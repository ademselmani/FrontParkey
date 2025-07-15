import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
  user: any = {
    firstName: '',
    lastName: '',
    location: {
      locationName: '',
      latitude: null,
      longitude: null
    }
  };

  constructor(private router: Router) {}

  ngOnInit() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.user = JSON.parse(userStr);
    }
  }

  goToMap() {
    this.router.navigate(['/step2']); 
  }
}
