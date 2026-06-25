import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, NgIf],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  public authService = inject(AuthService);
  public themeService = inject(ThemeService);

  // Demo interactive states
  public mockInputUrl = '';
  public mockShortenedUrl = '';
  public showRegisterPrompt = false;
  public copied = false;

  onShortenMock(urlInput: HTMLInputElement): void {
    const val = urlInput.value.trim();
    if (!val) {
      return;
    }
    
    // Add protocol if missing for display
    let formattedVal = val;
    if (!/^https?:\/\//i.test(val)) {
      formattedVal = 'https://' + val;
    }

    this.mockInputUrl = formattedVal;
    
    // Create a mock short code based on hashing the URL
    let hash = 0;
    for (let i = 0; i < formattedVal.length; i++) {
      hash = formattedVal.charCodeAt(i) + ((hash << 5) - hash);
    }
    const absHash = Math.abs(hash);
    const mockCode = absHash.toString(36).substring(0, 5).toUpperCase();
    this.mockShortenedUrl = `https://url-mng.up.railway.app/${mockCode}`;
    this.showRegisterPrompt = true;
    this.copied = false;
  }

  copyMockLink(): void {
    if (this.mockShortenedUrl) {
      navigator.clipboard.writeText(this.mockShortenedUrl);
      this.copied = true;
      setTimeout(() => (this.copied = false), 2000);
    }
  }

  resetDemo(urlInput: HTMLInputElement): void {
    this.mockInputUrl = '';
    this.mockShortenedUrl = '';
    this.showRegisterPrompt = false;
    urlInput.value = '';
    this.copied = false;
  }

  scrollToSection(id: string): void {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -76; // Offset by header height to prevent visual overlap
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    
    // Auto-close mobile navbar collapse menu if open
    const navbar = document.getElementById('landingNavbar');
    if (navbar && navbar.classList.contains('show')) {
      navbar.classList.remove('show');
      const toggler = document.querySelector('.navbar-toggler-custom');
      if (toggler) {
        toggler.setAttribute('aria-expanded', 'false');
      }
    }
  }
}
