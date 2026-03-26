import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Sale, CreateSaleDto } from '../models/sale.model';

@Injectable({
  providedIn: 'root',
})
export class SalesService {
  private readonly endpoint = 'sales';

  constructor(private apiService: ApiService) {}

  getAll(): Observable<Sale[]> {
    return this.apiService.get<Sale[]>(this.endpoint);
  }

  getById(id: string): Observable<Sale> {
    return this.apiService.get<Sale>(`${this.endpoint}/${id}`);
  }

  create(sale: CreateSaleDto): Observable<Sale> {
    return this.apiService.post<Sale>(this.endpoint, sale);
  }

  update(id: string, sale: Partial<CreateSaleDto>): Observable<Sale> {
    return this.apiService.patch<Sale>(`${this.endpoint}/${id}`, sale);
  }

  delete(id: string): Observable<void> {
    return this.apiService.delete<void>(`${this.endpoint}/${id}`);
  }

  search(searchParams: {
    saleNumber?: string;
    ticketNumber?: string;
    clientName?: string;
    saleDateFrom?: string;
    saleDateTo?: string;
    paymentType?: string;
  }): Observable<Sale[]> {
    const params: any = {};
    if (searchParams.saleNumber) params.saleNumber = searchParams.saleNumber;
    if (searchParams.ticketNumber) params.ticketNumber = searchParams.ticketNumber;
    if (searchParams.clientName) params.clientName = searchParams.clientName;
    if (searchParams.saleDateFrom) params.saleDateFrom = searchParams.saleDateFrom;
    if (searchParams.saleDateTo) params.saleDateTo = searchParams.saleDateTo;
    if (searchParams.paymentType) params.paymentType = searchParams.paymentType;
    
    const queryString = new URLSearchParams(params).toString();
    return this.apiService.get<Sale[]>(`${this.endpoint}/search?${queryString}`);
  }

  getDailySales(date?: string): Observable<Sale[]> {
    const params: any = {};
    if (date) params.date = date;
    
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${this.endpoint}/daily?${queryString}` : `${this.endpoint}/daily`;
    return this.apiService.get<Sale[]>(url);
  }

  generateTicketNumber(): Observable<{ ticketNumber: string }> {
    return this.apiService.get<{ ticketNumber: string }>(
      `${this.endpoint}/generate-ticket-number`,
    );
  }
}

