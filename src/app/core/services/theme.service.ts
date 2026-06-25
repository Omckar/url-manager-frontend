import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  // Signal to hold current theme state ('light' or 'dark')
  theme = signal<'light' | 'dark'>('light');

  constructor() {
    this.loadTheme();
  }

  toggleTheme(): void {
    const nextTheme = this.theme() === 'light' ? 'dark' : 'light';
    this.setTheme(nextTheme);
  }

  private setTheme(t: 'light' | 'dark'): void {
    this.theme.set(t);
    localStorage.setItem('theme', t);
    document.documentElement.setAttribute('data-theme', t);
  }

  private loadTheme(): void {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const preference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    this.setTheme(saved || preference);
  }
}
