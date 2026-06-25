import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-expired',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './expired.component.html',
  styleUrl: './expired.component.css',
})
export class ExpiredComponent {}
