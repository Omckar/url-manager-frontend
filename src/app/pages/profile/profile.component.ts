import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProfileService } from '../../core/services/profile.service';
import { AuthService } from '../../core/services/auth.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private profileService = inject(ProfileService);
  private authService = inject(AuthService);

  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  profileLoading = false;
  passwordLoading = false;

  profileMessage = '';
  profileError = '';
  passwordMessage = '';
  passwordError = '';

  ngOnInit(): void {
    this.initForms();
    this.loadProfile();
  }

  private initForms(): void {
    this.profileForm = this.fb.group({
      email: [{ value: '', disabled: true }],
      name: ['', [Validators.required]],
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(form: any): { mismatch: boolean } | null {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { mismatch: true };
  }

  private loadProfile(): void {
    this.profileService.getProfile().subscribe({
      next: (profile) => {
        this.profileForm.patchValue({
          email: profile.email,
          name: profile.name || '',
        });
      },
    });
  }

  onSubmitProfile(): void {
    if (this.profileForm.invalid) return;
    this.profileLoading = true;
    this.profileMessage = '';
    this.profileError = '';

    this.profileService.updateProfile({ name: this.profileForm.getRawValue().name }).subscribe({
      next: (res) => {
        this.profileLoading = false;
        this.profileMessage = 'Profile updated successfully.';
        this.authService.updateLocalUser(res.user.name);
      },
      error: (err) => {
        this.profileLoading = false;
        this.profileError = err.error?.message || 'Failed to update profile.';
      },
    });
  }

  onSubmitPassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.passwordLoading = true;
    this.passwordMessage = '';
    this.passwordError = '';

    const payload = {
      currentPassword: this.passwordForm.value.currentPassword,
      newPassword: this.passwordForm.value.newPassword,
    };

    this.profileService.changePassword(payload).subscribe({
      next: () => {
        this.passwordLoading = false;
        this.passwordMessage = 'Password changed successfully.';
        this.passwordForm.reset();
      },
      error: (err) => {
        this.passwordLoading = false;
        this.passwordError = err.error?.message || 'Failed to change password.';
      },
    });
  }
}
