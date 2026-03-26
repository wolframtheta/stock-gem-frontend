import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Supplier } from '../models/supplier.model';

@Injectable({
  providedIn: 'root',
})
export class SuppliersService {
  constructor(private apiService: ApiService) {}

  getAll(): Observable<Supplier[]> {
    return this.apiService.get<Supplier[]>('suppliers');
  }

  getById(id: string): Observable<Supplier> {
    return this.apiService.get<Supplier>(`suppliers/${id}`);
  }

  search(name?: string, phone?: string): Observable<Supplier[]> {
    const params: any = {};
    if (name) params.name = name;
    if (phone) params.phone = phone;
    
    const queryString = new URLSearchParams(params).toString();
    return this.apiService.get<Supplier[]>(`suppliers?${queryString}`);
  }

  create(supplier: Partial<Supplier>): Observable<Supplier> {
    return this.apiService.post<Supplier>('suppliers', supplier);
  }

  update(id: string, supplier: Partial<Supplier>): Observable<Supplier> {
    return this.apiService.patch<Supplier>(`suppliers/${id}`, supplier);
  }

  delete(id: string): Observable<void> {
    return this.apiService.delete<void>(`suppliers/${id}`);
  }
}
