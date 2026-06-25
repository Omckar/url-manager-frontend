import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { DashboardLayoutComponent } from './layouts/dashboard-layout/dashboard-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { UrlsComponent } from './pages/urls/urls.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { UnlockComponent } from './pages/unlock/unlock.component';
import { ExpiredComponent } from './pages/expired/expired.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { authGuard } from './core/guards/auth.guard';
import { noAuthGuard } from './core/guards/no-auth.guard';

export const routes: Routes = [
  // Public static & validation views
  { path: 'unlock/:shortCode', component: UnlockComponent },
  { path: 'expired', component: ExpiredComponent },
  { path: '404', component: NotFoundComponent },

  // Guest Authentication pages
  { path: 'auth/login', component: LoginComponent, canActivate: [noAuthGuard] },
  { path: 'auth/register', component: RegisterComponent, canActivate: [noAuthGuard] },

  // Secure Panel Layout containing Child Views
  {
    path: '',
    component: DashboardLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'urls', component: UrlsComponent },
      { path: 'profile', component: ProfileComponent },
    ],
  },

  // Absolute redirect to 404
  { path: '**', redirectTo: '404' },
];
