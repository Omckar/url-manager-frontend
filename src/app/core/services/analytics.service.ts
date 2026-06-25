import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private apiUrl = `${environment.apiUrl}/analytics`;

  constructor(private http: HttpClient) {}

  getDashboardData(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard`);
  }

  getRecentActivity(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/recent`);
  }

  getTopLinks(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/top`);
  }

  getUrlAnalytics(urlId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/url/${urlId}`);
  }
}
