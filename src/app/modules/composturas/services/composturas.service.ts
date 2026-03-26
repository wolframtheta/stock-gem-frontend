import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Compostura, CreateComposturaDto } from '../models/compostura.model';

@Injectable({
  providedIn: 'root',
})
export class ComposturasService {
  constructor(private apiService: ApiService) {}

  getAll(): Observable<Compostura[]> {
    return this.apiService.get<Compostura[]>('composturas');
  }

  getById(id: string): Observable<Compostura> {
    return this.apiService.get<Compostura>(`composturas/${id}`);
  }

  search(params: {
    code?: string;
    clientId?: string;
    workshopId?: string;
    clientName?: string;
    workshopName?: string;
    entryDateFrom?: string;
    entryDateTo?: string;
  }): Observable<Compostura[]> {
    const queryParams: any = {};
    Object.keys(params).forEach((key) => {
      if (params[key as keyof typeof params]) {
        queryParams[key] = params[key as keyof typeof params];
      }
    });

    const queryString = new URLSearchParams(queryParams).toString();
    return this.apiService.get<Compostura[]>(
      `composturas?${queryString}`,
    );
  }

  create(compostura: CreateComposturaDto): Observable<Compostura> {
    return this.apiService.post<Compostura>('composturas', compostura);
  }

  update(id: string, compostura: Partial<CreateComposturaDto>): Observable<Compostura> {
    return this.apiService.patch<Compostura>(`composturas/${id}`, compostura);
  }

  delete(id: string): Observable<void> {
    return this.apiService.delete<void>(`composturas/${id}`);
  }
}

