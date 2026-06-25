import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UrlService {
  private apiUrl = `${environment.apiUrl}/urls`;

  constructor(private http: HttpClient) {}

  create(payload: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, payload);
  }

  findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    filter?: string;
    sortBy?: string;
  }): Observable<any> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.filter) httpParams = httpParams.set('filter', params.filter);
    if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);

    return this.http.get<any>(this.apiUrl, { params: httpParams });
  }

  findOne(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  update(id: number, payload: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  verifyPassword(shortCode: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/verify-password`, { shortCode, password });
  }
}
