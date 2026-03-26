import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface SalesByStoreRow {
  id: string;
  name: string;
  code?: string;
  totalAmount: number;
  saleCount: number;
}

export interface SalesByArticleRow {
  articleId: string;
  articleRef: string;
  articleDesc: string;
  quantitySold: number;
  totalAmount: number;
}

export interface SalesByFairRow {
  fairId: string;
  fairName: string;
  totalAmount: number;
  saleCount: number;
}

export interface ManufacturingRow {
  articleId: string;
  articleRef: string;
  articleDesc: string;
  quantityAdded: number;
}

export type TimeSeriesGranularity = 'month' | 'week';

export interface TimeSeriesResponse {
  periods: string[];
  series: { id: string; label: string; data: number[] }[];
}

@Injectable({
  providedIn: 'root',
})
export class StatisticsService {
  private readonly endpoint = 'statistics';

  constructor(private api: ApiService) {}

  private qs(
    from?: string,
    to?: string,
    granularity?: TimeSeriesGranularity,
  ): string {
    const p: string[] = [];
    if (from) p.push(`from=${encodeURIComponent(from)}`);
    if (to) p.push(`to=${encodeURIComponent(to)}`);
    if (granularity) p.push(`granularity=${encodeURIComponent(granularity)}`);
    return p.length ? '?' + p.join('&') : '';
  }

  getSalesByStore(from?: string, to?: string): Observable<SalesByStoreRow[]> {
    return this.api.get<SalesByStoreRow[]>(
      `${this.endpoint}/sales-by-store${this.qs(from, to)}`,
    );
  }

  getSalesByArticle(
    from?: string,
    to?: string,
  ): Observable<SalesByArticleRow[]> {
    return this.api.get<SalesByArticleRow[]>(
      `${this.endpoint}/sales-by-article${this.qs(from, to)}`,
    );
  }

  getSalesByFair(from?: string, to?: string): Observable<SalesByFairRow[]> {
    return this.api.get<SalesByFairRow[]>(
      `${this.endpoint}/sales-by-fair${this.qs(from, to)}`,
    );
  }

  getManufacturing(
    from?: string,
    to?: string,
  ): Observable<ManufacturingRow[]> {
    return this.api.get<ManufacturingRow[]>(
      `${this.endpoint}/manufacturing${this.qs(from, to)}`,
    );
  }

  getSalesByStoreTimeSeries(
    from?: string,
    to?: string,
    granularity: TimeSeriesGranularity = 'month',
  ): Observable<TimeSeriesResponse> {
    return this.api.get<TimeSeriesResponse>(
      `${this.endpoint}/sales-by-store/time-series${this.qs(from, to, granularity)}`,
    );
  }

  getSalesByArticleTimeSeries(
    from?: string,
    to?: string,
    granularity: TimeSeriesGranularity = 'month',
  ): Observable<TimeSeriesResponse> {
    return this.api.get<TimeSeriesResponse>(
      `${this.endpoint}/sales-by-article/time-series${this.qs(from, to, granularity)}`,
    );
  }

  getSalesByFairTimeSeries(
    from?: string,
    to?: string,
    granularity: TimeSeriesGranularity = 'month',
  ): Observable<TimeSeriesResponse> {
    return this.api.get<TimeSeriesResponse>(
      `${this.endpoint}/sales-by-fair/time-series${this.qs(from, to, granularity)}`,
    );
  }

  getManufacturingTimeSeries(
    from?: string,
    to?: string,
    granularity: TimeSeriesGranularity = 'month',
  ): Observable<TimeSeriesResponse> {
    return this.api.get<TimeSeriesResponse>(
      `${this.endpoint}/manufacturing/time-series${this.qs(from, to, granularity)}`,
    );
  }
}
