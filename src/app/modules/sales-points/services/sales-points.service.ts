import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  SalesPoint,
  SalesPointStockItem,
} from '../models/sales-point.model';

@Injectable({
  providedIn: 'root',
})
export class SalesPointsService {
  private readonly endpoint = 'sales-points';

  constructor(private apiService: ApiService) {}

  getAll(): Observable<SalesPoint[]> {
    return this.apiService.get<SalesPoint[]>(this.endpoint);
  }

  getDefaultWarehouse(): Observable<SalesPoint | null> {
    return this.apiService.get<SalesPoint | null>(
      `${this.endpoint}/default-warehouse`,
    );
  }

  getById(id: string): Observable<SalesPoint> {
    return this.apiService.get<SalesPoint>(`${this.endpoint}/${id}`);
  }

  create(salesPoint: Partial<SalesPoint>): Observable<SalesPoint> {
    return this.apiService.post<SalesPoint>(this.endpoint, salesPoint);
  }

  update(id: string, salesPoint: Partial<SalesPoint>): Observable<SalesPoint> {
    return this.apiService.patch<SalesPoint>(`${this.endpoint}/${id}`, salesPoint);
  }

  delete(id: string): Observable<void> {
    return this.apiService.delete<void>(`${this.endpoint}/${id}`);
  }

  getStock(salesPointId: string): Observable<SalesPointStockItem[]> {
    return this.apiService.get<SalesPointStockItem[]>(
      `${this.endpoint}/${salesPointId}/stock`,
    );
  }

  getAvailableForAdd(salesPointId: string): Observable<
    {
      articleId: string;
      ownReference: string;
      description: string;
      quantityAvailable: number;
      quantityAtDestination: number;
    }[]
  > {
    return this.apiService.get(
      `${this.endpoint}/${salesPointId}/available-for-add`,
    );
  }

  assignStock(
    salesPointId: string,
    articleId: string,
    quantity: number,
  ): Observable<SalesPointStockItem> {
    return this.apiService.patch<SalesPointStockItem>(
      `${this.endpoint}/${salesPointId}/stock`,
      { articleId, quantity },
    );
  }

  assignStockBatch(
    salesPointId: string,
    items: { articleId: string; quantity: number }[],
  ): Observable<SalesPointStockItem[]> {
    return this.apiService.post<SalesPointStockItem[]>(
      `${this.endpoint}/${salesPointId}/stock/batch`,
      { items },
    );
  }

  updateStockAtPoint(
    salesPointId: string,
    articleId: string,
    quantity: number,
  ): Observable<SalesPointStockItem> {
    return this.apiService.patch<SalesPointStockItem>(
      `${this.endpoint}/${salesPointId}/stock/${articleId}`,
      { quantity },
    );
  }

  removeFromPoint(
    salesPointId: string,
    articleId: string,
  ): Observable<void> {
    return this.apiService.delete<void>(
      `${this.endpoint}/${salesPointId}/stock/${articleId}`,
    );
  }

  moveStock(
    fromType: 'point' | 'fair',
    fromId: string,
    toType: 'point' | 'fair',
    toId: string,
    items: { articleId: string; quantity: number }[],
  ): Observable<void> {
    return this.apiService.post<void>(`${this.endpoint}/move-stock`, {
      fromType,
      fromId,
      toType,
      toId,
      items,
    });
  }
}
