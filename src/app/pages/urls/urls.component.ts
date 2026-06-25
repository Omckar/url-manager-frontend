import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UrlService } from '../../core/services/url.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { DialogService } from '../../core/services/dialog.service';
import { environment } from '../../../environments/environment';
import { NgIf, NgFor, DecimalPipe, DatePipe, CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import * as QRCode from 'qrcode';

Chart.register(...registerables);

@Component({
  selector: 'app-urls',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, DecimalPipe, DatePipe],
  templateUrl: './urls.component.html',
  styleUrl: './urls.component.css',
})
export class UrlsComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private urlService = inject(UrlService);
  private analyticsService = inject(AnalyticsService);
  private dialogService = inject(DialogService);

  baseUrl = environment.baseUrl;

  @ViewChild('urlClicksCanvas') urlClicksCanvas!: ElementRef<HTMLCanvasElement>;

  // Data states
  urlsList: any[] = [];
  totalUrls = 0;
  currentPage = 1;
  limit = 10;
  totalPages = 1;
  
  // Search & Filter parameters
  searchQuery = '';
  filterStatus = '';
  sortBy = 'newest';

  isLoading = true;
  copiedId: number | null = null;

  // Modals / Detail Panel states
  activeUrl: any = null; // Currently selected URL for editing/details
  editForm!: FormGroup;
  editLoading = false;
  
  // QR state
  selectedQrCodeUrl = '';
  selectedQrCodeText = '';

  // Analytics panel state
  showPassword = false;
  analyticsUrl: any = null;
  analyticsLoading = false;
  private urlChartInstance: Chart | null = null;

  ngOnInit(): void {
    this.initEditForm();
    this.loadUrls();
  }

  ngOnDestroy(): void {
    this.destroyUrlChart();
  }

  initEditForm(): void {
    this.editForm = this.fb.group({
      customAlias: [''],
      expiryDate: [''],
      password: [''],
      isActive: [true],
    });
  }

  loadUrls(page: number = 1): void {
    this.currentPage = page;
    this.isLoading = true;

    this.urlService
      .findAll({
        page: this.currentPage,
        limit: this.limit,
        search: this.searchQuery || undefined,
        filter: this.filterStatus || undefined,
        sortBy: this.sortBy,
      })
      .subscribe({
        next: (res) => {
          this.urlsList = res.data;
          this.totalUrls = res.total;
          this.totalPages = res.totalPages;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  // Filters, sorting and search triggers
  onSearch(event: any): void {
    this.searchQuery = event.target.value;
    this.loadUrls(1);
  }

  onFilterStatus(event: any): void {
    this.filterStatus = event.target.value;
    this.loadUrls(1);
  }

  onSortBy(event: any): void {
    this.sortBy = event.target.value;
    this.loadUrls(1);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.loadUrls(page);
    }
  }

  copyLink(urlId: number, shortCode: string): void {
    const fullUrl = `${this.baseUrl}/${shortCode}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      this.copiedId = urlId;
      setTimeout(() => (this.copiedId = null), 2000);
    });
  }

  isExpired(url: any): boolean {
    if (!url.expiryDate) return false;
    return new Date(url.expiryDate) < new Date();
  }

  // Active status toggle
  toggleActive(url: any): void {
    const newStatus = !url.isActive;
    this.urlService.update(url.id, { isActive: newStatus }).subscribe({
      next: () => {
        url.isActive = newStatus;
      },
      error: (err) => {
        this.dialogService.alert(err.error?.message || 'Failed to update URL status', 'Error', { variant: 'danger' });
      },
    });
  }

  // Delete URL handler
  async deleteUrl(id: number): Promise<void> {
    const confirmed = await this.dialogService.confirm(
      'Are you sure you want to delete this link and all associated click analytics? This action cannot be undone.',
      'Delete Shortened Link',
      {
        confirmText: 'Delete Link',
        cancelText: 'Cancel',
        variant: 'danger',
      }
    );

    if (confirmed) {
      this.urlService.delete(id).subscribe({
        next: () => {
          this.loadUrls(this.currentPage);
          if (this.activeUrl?.id === id) this.activeUrl = null;
          if (this.analyticsUrl?.id === id) this.closeAnalytics();
        },
      });
    }
  }

  // Open Edit panel
  openEditModal(url: any): void {
    this.activeUrl = url;
    
    // Format expiration date to fit datetime-local input
    let formattedDate = '';
    if (url.expiryDate) {
      const d = new Date(url.expiryDate);
      formattedDate = d.toISOString().slice(0, 16);
    }

    this.editForm.patchValue({
      customAlias: url.customAlias || '',
      expiryDate: formattedDate,
      password: '',
      isActive: url.isActive,
    });
  }

  closeEditModal(): void {
    this.activeUrl = null;
  }

  onSubmitEdit(): void {
    if (this.editForm.invalid) return;
    this.editLoading = true;

    const values = this.editForm.value;
    const payload = {
      customAlias: values.customAlias || '',
      expiryDate: values.expiryDate ? new Date(values.expiryDate).toISOString() : null,
      password: values.password || undefined,
      isActive: values.isActive,
    };

    this.urlService.update(this.activeUrl.id, payload).subscribe({
      next: () => {
        this.editLoading = false;
        this.activeUrl = null;
        this.loadUrls(this.currentPage);
      },
      error: (err) => {
        this.editLoading = false;
        this.dialogService.alert(err.error?.message || 'Failed to update link settings.', 'Error', { variant: 'danger' });
      },
    });
  }

  // QR Code presentation modal trigger
  openQrModal(shortCode: string): void {
    const fullUrl = `${this.baseUrl}/${shortCode}`;
    this.selectedQrCodeText = fullUrl;
    
    QRCode.toDataURL(fullUrl, { width: 300, margin: 2 })
      .then((url) => {
        this.selectedQrCodeUrl = url;
      })
      .catch((err) => {
        console.error('Failed to generate QR Code', err);
      });
  }

  closeQrModal(): void {
    this.selectedQrCodeUrl = '';
    this.selectedQrCodeText = '';
  }

  // Analytics slide-out side panel
  viewAnalytics(url: any): void {
    this.analyticsUrl = url;
    this.analyticsLoading = true;
    this.destroyUrlChart();

    this.analyticsService.getUrlAnalytics(url.id).subscribe({
      next: (res) => {
        this.analyticsLoading = false;
        setTimeout(() => {
          this.renderUrlChart(res);
        }, 0);
      },
      error: () => {
        this.analyticsLoading = false;
      },
    });
  }

  closeAnalytics(): void {
    this.analyticsUrl = null;
    this.destroyUrlChart();
  }

  private renderUrlChart(data: any): void {
    if (!this.urlClicksCanvas) return;
    const ctx = this.urlClicksCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = data.clicksOverTime.map((d: any) => d.date);
    const clicks = data.clicksOverTime.map((d: any) => d.count);

    this.urlChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels.length ? labels : ['No data'],
        datasets: [
          {
            label: 'Clicks',
            data: clicks.length ? clicks : [0],
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

  private destroyUrlChart(): void {
    if (this.urlChartInstance) {
      this.urlChartInstance.destroy();
      this.urlChartInstance = null;
    }
  }
}
