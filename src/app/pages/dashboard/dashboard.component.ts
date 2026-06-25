import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AnalyticsService } from '../../core/services/analytics.service';
import { UrlService } from '../../core/services/url.service';
import { DialogService } from '../../core/services/dialog.service';
import { environment } from '../../../environments/environment';
import { NgIf, NgFor, DecimalPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import * as QRCode from 'qrcode';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgFor, RouterLink, DecimalPipe, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  private analyticsService = inject(AnalyticsService);
  private urlService = inject(UrlService);
  private dialogService = inject(DialogService);

  baseUrl = environment.baseUrl;

  @ViewChild('clicksChartCanvas') clicksChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('deviceChartCanvas') deviceChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('browserChartCanvas') browserChartCanvas!: ElementRef<HTMLCanvasElement>;

  quickCreateForm: FormGroup = this.fb.group({
    longUrl: ['', [Validators.required, Validators.pattern(/https?:\/\/.+/)]],
    customAlias: [''],
    expiryOption: ['never'],
    customExpiryDate: [''],
    password: [''],
  });

  // UI state variables
  stats: any = null;
  recentActivity: any[] = [];
  topLinks: any[] = [];
  isLoading = true;
  isSubmitting = false;
  
  // Quick URL creation success state
  createdUrl: any = null;
  copied = false;
  qrCodeUrl = '';

  // Chart instances
  private clicksChart: Chart | null = null;
  private deviceChart: Chart | null = null;
  private browserChart: Chart | null = null;

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    // Chart rendering happens after views are initialized and data is loaded.
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.analyticsService.getDashboardData().subscribe({
      next: (data) => {
        this.stats = data.stats;
        this.isLoading = false;
        
        // Wait for views to update before instantiating charts
        setTimeout(() => {
          this.renderCharts(data.charts);
        }, 0);
      },
      error: () => {
        this.isLoading = false;
      },
    });

    this.analyticsService.getRecentActivity().subscribe({
      next: (data) => {
        this.recentActivity = data;
      },
    });

    this.analyticsService.getTopLinks().subscribe({
      next: (data) => {
        this.topLinks = data;
      },
    });
  }

  onSubmitQuickCreate(): void {
    if (this.quickCreateForm.invalid) {
      this.quickCreateForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.createdUrl = null;
    this.qrCodeUrl = '';
    this.copied = false;

    const formValues = this.quickCreateForm.value;
    
    // Parse expiry date selection
    let expiryDate: string | undefined = undefined;
    if (formValues.expiryOption !== 'never') {
      const now = new Date();
      if (formValues.expiryOption === '1day') {
        now.setDate(now.getDate() + 1);
        expiryDate = now.toISOString();
      } else if (formValues.expiryOption === '7days') {
        now.setDate(now.getDate() + 7);
        expiryDate = now.toISOString();
      } else if (formValues.expiryOption === '30days') {
        now.setDate(now.getDate() + 30);
        expiryDate = now.toISOString();
      } else if (formValues.expiryOption === 'custom') {
        expiryDate = new Date(formValues.customExpiryDate).toISOString();
      }
    }

    const payload = {
      longUrl: formValues.longUrl,
      customAlias: formValues.customAlias || undefined,
      expiryDate,
      password: formValues.password || undefined,
    };

    this.urlService.create(payload).subscribe({
      next: (url) => {
        this.isSubmitting = false;
        this.createdUrl = url;
        this.quickCreateForm.reset({ expiryOption: 'never' });
        this.generateQrCode(url.shortCode);
        this.loadDashboardData(); // Refresh metrics
      },
      error: (err) => {
        this.isSubmitting = false;
        this.dialogService.alert(err.error?.message || 'Failed to create short link', 'Error', { variant: 'danger' });
      },
    });
  }

  copyLink(shortCode: string): void {
    const fullUrl = `${this.baseUrl}/${shortCode}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      this.copied = true;
      setTimeout(() => (this.copied = false), 2000);
    });
  }

  generateQrCode(shortCode: string): void {
    const fullUrl = `${this.baseUrl}/${shortCode}`;
    QRCode.toDataURL(fullUrl, { width: 250, margin: 2 })
      .then((url) => {
        this.qrCodeUrl = url;
      })
      .catch((err) => {
        console.error('Failed to generate QR Code', err);
      });
  }

  private renderCharts(chartsData: any): void {
    this.destroyCharts();

    if (!chartsData) return;

    // 1. Clicks over time chart (Line)
    const lineCtx = this.clicksChartCanvas?.nativeElement.getContext('2d');
    if (lineCtx) {
      const labels = chartsData.clicksOverTime.map((d: any) => d.date);
      const data = chartsData.clicksOverTime.map((d: any) => d.count);

      this.clicksChart = new Chart(lineCtx, {
        type: 'line',
        data: {
          labels: labels.length ? labels : ['No data'],
          datasets: [
            {
              label: 'Clicks',
              data: data.length ? data : [0],
              borderColor: '#4f46e5',
              backgroundColor: 'rgba(79, 70, 229, 0.1)',
              fill: true,
              tension: 0.3,
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } },
          },
        },
      });
    }

    // 2. Device distribution (Doughnut)
    const deviceCtx = this.deviceChartCanvas?.nativeElement.getContext('2d');
    if (deviceCtx) {
      const labels = chartsData.deviceDistribution.map((d: any) => d.name);
      const data = chartsData.deviceDistribution.map((d: any) => d.value);

      this.deviceChart = new Chart(deviceCtx, {
        type: 'doughnut',
        data: {
          labels: labels.length ? labels : ['No data'],
          datasets: [
            {
              data: data.length ? data : [1],
              backgroundColor: ['#4f46e5', '#7c3aed', '#10b981', '#f59e0b', '#6b7280'],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } },
        },
      });
    }

    // 3. Browser distribution (Bar)
    const browserCtx = this.browserChartCanvas?.nativeElement.getContext('2d');
    if (browserCtx) {
      const labels = chartsData.browserDistribution.map((d: any) => d.name);
      const data = chartsData.browserDistribution.map((d: any) => d.value);

      this.browserChart = new Chart(browserCtx, {
        type: 'bar',
        data: {
          labels: labels.length ? labels : ['No data'],
          datasets: [
            {
              label: 'Clicks',
              data: data.length ? data : [0],
              backgroundColor: '#3b82f6',
              borderRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } },
          },
        },
      });
    }
  }

  private destroyCharts(): void {
    if (this.clicksChart) {
      this.clicksChart.destroy();
      this.clicksChart = null;
    }
    if (this.deviceChart) {
      this.deviceChart.destroy();
      this.deviceChart = null;
    }
    if (this.browserChart) {
      this.browserChart.destroy();
      this.browserChart = null;
    }
  }
}
