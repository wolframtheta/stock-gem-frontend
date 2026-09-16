import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  Personalization,
  CreatePersonalizationDto,
} from '../models/personalization.model';

@Injectable({
  providedIn: 'root',
})
export class PersonalizationsService {
  constructor(private apiService: ApiService) {}

  getAll(): Observable<Personalization[]> {
    return this.apiService.get<Personalization[]>('personalizations');
  }

  getById(id: string): Observable<Personalization> {
    return this.apiService.get<Personalization>(`personalizations/${id}`);
  }

  search(params: {
    code?: string;
    clientId?: string;
    workshopId?: string;
    clientName?: string;
    workshopName?: string;
    entryDateFrom?: string;
    entryDateTo?: string;
  }): Observable<Personalization[]> {
    const queryParams: Record<string, string> = {};
    Object.keys(params).forEach((key) => {
      const value = params[key as keyof typeof params];
      if (value) {
        queryParams[key] = value;
      }
    });

    const queryString = new URLSearchParams(queryParams).toString();
    return this.apiService.get<Personalization[]>(
      `personalizations?${queryString}`,
    );
  }

  create(
    personalization: CreatePersonalizationDto,
  ): Observable<Personalization> {
    return this.apiService.post<Personalization>(
      'personalizations',
      personalization,
    );
  }

  update(
    id: string,
    personalization: Partial<CreatePersonalizationDto>,
  ): Observable<Personalization> {
    return this.apiService.patch<Personalization>(
      `personalizations/${id}`,
      personalization,
    );
  }

  delete(id: string): Observable<void> {
    return this.apiService.delete<void>(`personalizations/${id}`);
  }
}
