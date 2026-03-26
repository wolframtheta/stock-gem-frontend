import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Workshop } from '../models/workshop.model';

@Injectable({
  providedIn: 'root',
})
export class WorkshopsService {
  constructor(private apiService: ApiService) {}

  getAll(): Observable<Workshop[]> {
    return this.apiService.get<Workshop[]>('workshops');
  }

  getById(id: string): Observable<Workshop> {
    return this.apiService.get<Workshop>(`workshops/${id}`);
  }

  search(name?: string, phone?: string): Observable<Workshop[]> {
    const params: any = {};
    if (name) params.name = name;
    if (phone) params.phone = phone;
    
    const queryString = new URLSearchParams(params).toString();
    return this.apiService.get<Workshop[]>(`workshops?${queryString}`);
  }

  create(workshop: Partial<Workshop>): Observable<Workshop> {
    return this.apiService.post<Workshop>('workshops', workshop);
  }

  update(id: string, workshop: Partial<Workshop>): Observable<Workshop> {
    return this.apiService.patch<Workshop>(`workshops/${id}`, workshop);
  }

  delete(id: string): Observable<void> {
    return this.apiService.delete<void>(`workshops/${id}`);
  }
}

