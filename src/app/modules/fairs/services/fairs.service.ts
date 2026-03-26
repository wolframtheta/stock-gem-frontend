import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import type { TimeSeriesResponse } from '../../statistics/services/statistics.service';

export interface Fair {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface FairStockItem {
  id: string;
  fairId: string;
  articleId: string;
  quantity: number;
  maxQuantity?: number;
  article?: {
    id: string;
    ownReference: string;
    description: string;
    stock: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class FairsService {
  private readonly endpoint = 'fairs';

  constructor(private api: ApiService) {}

  getAll(): Observable<Fair[]> {
    return this.api.get<Fair[]>(this.endpoint);
  }

  getById(id: string): Observable<Fair> {
    return this.api.get<Fair>(`${this.endpoint}/${id}`);
  }

  create(fair: Partial<Fair>): Observable<Fair> {
    return this.api.post<Fair>(this.endpoint, fair);
  }

  update(id: string, fair: Partial<Fair>): Observable<Fair> {
    return this.api.patch<Fair>(`${this.endpoint}/${id}`, fair);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }

  getStock(fairId: string): Observable<FairStockItem[]> {
    return this.api.get<FairStockItem[]>(`${this.endpoint}/${fairId}/stock`);
  }

  updateStock(
    fairId: string,
    items: { articleId: string; quantity: number }[],
  ): Observable<FairStockItem[]> {
    return this.api.patch<FairStockItem[]>(
      `${this.endpoint}/${fairId}/stock`,
      { items },
    );
  }

  getStatistics(fairId: string): Observable<FairStatistics> {
    return this.api.get<FairStatistics>(`${this.endpoint}/${fairId}/statistics`);
  }

  private statsQs(from?: string, to?: string, granularity?: string): string {
    const p: string[] = [];
    if (from) p.push(`from=${encodeURIComponent(from)}`);
    if (to) p.push(`to=${encodeURIComponent(to)}`);
    if (granularity) p.push(`granularity=${encodeURIComponent(granularity)}`);
    return p.length ? '?' + p.join('&') : '';
  }

  getSalesTimeSeries(
    fairId: string,
    from?: string,
    to?: string,
    granularity = 'week',
  ): Observable<TimeSeriesResponse> {
    return this.api.get<TimeSeriesResponse>(
      `${this.endpoint}/${fairId}/statistics/sales-time-series${this.statsQs(from, to, granularity)}`,
    );
  }

  getArticlesTimeSeries(
    fairId: string,
    from?: string,
    to?: string,
    granularity = 'week',
  ): Observable<TimeSeriesResponse> {
    return this.api.get<TimeSeriesResponse>(
      `${this.endpoint}/${fairId}/statistics/articles-time-series${this.statsQs(from, to, granularity)}`,
    );
  }

  getComposturasTimeSeries(
    fairId: string,
    from?: string,
    to?: string,
    granularity = 'week',
  ): Observable<TimeSeriesResponse> {
    return this.api.get<TimeSeriesResponse>(
      `${this.endpoint}/${fairId}/statistics/composturas-time-series${this.statsQs(from, to, granularity)}`,
    );
  }

  finalize(fairId: string): Observable<{ message: string }> {
    return this.api.post<{ message: string }>(
      `${this.endpoint}/${fairId}/finalize`,
      {},
    );
  }

  reopen(fairId: string): Observable<{ message: string }> {
    return this.api.post<{ message: string }>(
      `${this.endpoint}/${fairId}/reopen`,
      {},
    );
  }
}

export interface FairStatistics {
  totalAmount: number;
  saleCount: number;
  totalCost: number;
  profit: number;
}
