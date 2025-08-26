import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RegisterStep1Component } from './pages/register-step1/register-step1.component';
import { RegisterStep2Component } from './pages/register-step2/register-step2.component';
import { ProfileComponent } from './pages/profile/profile.component';

const routes: Routes = [
  { path: '', component: RegisterStep1Component },
  { path: 'step2', component: RegisterStep2Component },
  { path: 'profile', component: ProfileComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
