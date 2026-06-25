import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { DialogService } from '../../core/services/dialog.service';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.css',
})
export class DashboardLayoutComponent {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  dialogService = inject(DialogService);

  getUserDisplayName(): string {
    const user = this.authService.currentUser();
    if (!user) return 'User';
    if (user.name && user.name.trim()) return user.name;
    if (user.email) {
      const prefix = user.email.split('@')[0];
      return prefix
        .split(/[._-]/)
        .filter((word: string) => word.length > 0)
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    return 'User';
  }

  async logout(): Promise<void> {
    const confirmLogout = await this.dialogService.confirm(
      'Are you sure you want to log out of your session?',
      'Confirm Logout',
      {
        confirmText: 'Logout',
        cancelText: 'Cancel',
        variant: 'warning',
      }
    );

    if (confirmLogout) {
      this.authService.logout();
    }
  }
}
