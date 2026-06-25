import { Injectable, signal } from '@angular/core';

export interface DialogOptions {
  confirmText?: string;
  cancelText?: string;
  variant?: 'info' | 'warning' | 'danger' | 'success';
}

export interface DialogState {
  isOpen: boolean;
  type: 'alert' | 'confirm';
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  variant: 'info' | 'warning' | 'danger' | 'success';
  resolve?: (value: any) => void;
}

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  state = signal<DialogState>({
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Cancel',
    variant: 'info',
  });

  alert(message: string, title: string = 'Alert', options?: DialogOptions): Promise<void> {
    return new Promise((resolve) => {
      this.state.set({
        isOpen: true,
        type: 'alert',
        title,
        message,
        confirmText: options?.confirmText || 'OK',
        cancelText: options?.cancelText || 'Cancel',
        variant: options?.variant || 'info',
        resolve,
      });
    });
  }

  confirm(message: string, title: string = 'Confirm', options?: DialogOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this.state.set({
        isOpen: true,
        type: 'confirm',
        title,
        message,
        confirmText: options?.confirmText || 'Confirm',
        cancelText: options?.cancelText || 'Cancel',
        variant: options?.variant || 'warning',
        resolve,
      });
    });
  }

  close(result: boolean): void {
    const currentState = this.state();
    if (currentState.resolve) {
      currentState.resolve(result);
    }
    this.state.set({
      ...currentState,
      isOpen: false,
      resolve: undefined,
    });
  }
}
