import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CustomDialogComponent } from './shared/components/custom-dialog/custom-dialog.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CustomDialogComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'url-manager-frontend';
}
