import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { RegisterStep1Component } from './pages/register-step1/register-step1.component';
import { RegisterStep2Component } from './pages/register-step2/register-step2.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [AppComponent, RegisterStep1Component, RegisterStep2Component, ProfileComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,FormsModule, HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
