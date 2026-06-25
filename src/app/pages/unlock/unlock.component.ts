import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UrlService } from '../../core/services/url.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-unlock',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf],
  templateUrl: './unlock.component.html',
  styleUrl: './unlock.component.css',
})
export class UnlockComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private urlService = inject(UrlService);

  unlockForm!: FormGroup;
  shortCode = '';
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  ngOnInit(): void {
    this.shortCode = this.route.snapshot.paramMap.get('shortCode') || '';
    this.unlockForm = this.fb.group({
      password: ['', [Validators.required]],
    });
  }

  onSubmit(): void {
    if (this.unlockForm.invalid) return;
    this.isLoading = true;
    this.errorMessage = '';

    this.urlService.verifyPassword(this.shortCode, this.unlockForm.value.password).subscribe({
      next: (res) => {
        this.isLoading = false;
        // Perform standard external redirect to target long URL
        window.location.href = res.longUrl;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Incorrect password. Access denied.';
      },
    });
  }
}
