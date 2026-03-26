import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Client } from '../models/client.model';

@Injectable({
  providedIn: 'root',
})
export class ClientsService {
  constructor(private apiService: ApiService) {}

  getAll(): Observable<Client[]> {
    return this.apiService.get<Client[]>('clients');
  }

  getById(id: string): Observable<Client> {
    return this.apiService.get<Client>(`clients/${id}`);
  }

  search(name?: string, phone?: string): Observable<Client[]> {
    const params: any = {};
    if (name) params.name = name;
    if (phone) params.phone = phone;
    
    const queryString = new URLSearchParams(params).toString();
    return this.apiService.get<Client[]>(`clients?${queryString}`);
  }

  create(client: Partial<Client>): Observable<Client> {
    return this.apiService.post<Client>('clients', client);
  }

  update(id: string, client: Partial<Client>): Observable<Client> {
    return this.apiService.patch<Client>(`clients/${id}`, client);
  }

  delete(id: string): Observable<void> {
    return this.apiService.delete<void>(`clients/${id}`);
  }
}

