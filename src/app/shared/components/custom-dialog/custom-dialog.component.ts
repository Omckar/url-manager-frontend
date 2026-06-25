import { Component, inject } from '@angular/core';
import { DialogService } from '../../../core/services/dialog.service';
import { NgIf, NgClass } from '@angular/common';

@Component({
  selector: 'app-custom-dialog',
  standalone: true,
  imports: [NgIf, NgClass],
  templateUrl: './custom-dialog.component.html',
  styleUrl: './custom-dialog.component.css',
})
export class CustomDialogComponent {
  dialogService = inject(DialogService);

  get state() {
    return this.dialogService.state();
  }

  onConfirm(): void {
    this.dialogService.close(true);
  }

  onCancel(): void {
    this.dialogService.close(false);
  }
}
