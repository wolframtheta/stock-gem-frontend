import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  Article,
  CreateArticleDto,
  StockBreakdown,
  ArticlePriceHistory,
  ArticleStockHistory,
} from '../models/article.model';

@Injectable({
  providedIn: 'root',
})
export class ArticlesService {
  constructor(private apiService: ApiService) {}

  getAll(): Observable<Article[]> {
    return this.apiService.get<Article[]>('articles');
  }

  getById(id: string): Observable<Article> {
    return this.apiService.get<Article>(`articles/${id}`);
  }

  search(params: {
    ownReference?: string;
    supplierReference?: string;
    description?: string;
    collectionId?: string;
    articleTypeId?: string;
    q?: string;
  } = {}): Observable<Article[]> {
    const searchParams = new URLSearchParams();
    if (params.ownReference) searchParams.set('ownReference', params.ownReference);
    if (params.supplierReference) searchParams.set('supplierReference', params.supplierReference);
    if (params.description) searchParams.set('description', params.description);
    if (params.collectionId) searchParams.set('collectionId', params.collectionId);
    if (params.articleTypeId) searchParams.set('articleTypeId', params.articleTypeId);
    if (params.q?.trim()) searchParams.set('q', params.q.trim());

    const queryString = searchParams.toString();
    return this.apiService.get<Article[]>(`articles?${queryString}`);
  }

  create(article: CreateArticleDto): Observable<Article> {
    return this.apiService.post<Article>('articles', article);
  }

  update(id: string, article: Partial<CreateArticleDto>): Observable<Article> {
    return this.apiService.patch<Article>(`articles/${id}`, article);
  }

  delete(id: string): Observable<void> {
    return this.apiService.delete<void>(`articles/${id}`);
  }

  updateStock(id: string, quantity: number): Observable<Article> {
    return this.apiService.patch<Article>(`articles/${id}/stock`, { quantity });
  }

  getAvailableQuantity(id: string): Observable<{ available: number }> {
    return this.apiService.get<{ available: number }>(
      `articles/${id}/available-quantity`,
    );
  }

  getStockBreakdown(id: string): Observable<StockBreakdown> {
    return this.apiService.get<StockBreakdown>(`articles/${id}/stock-breakdown`);
  }

  addStock(
    id: string,
    quantity: number,
    date: string,
  ): Observable<Article> {
    return this.apiService.post<Article>(`articles/${id}/add-stock`, {
      quantity,
      date,
    });
  }

  getPriceHistory(id: string): Observable<ArticlePriceHistory[]> {
    return this.apiService.get<ArticlePriceHistory[]>(
      `articles/${id}/price-history`,
    );
  }

  getStockHistory(
    id: string,
    year?: number,
  ): Observable<ArticleStockHistory[]> {
    const params = year ? `?year=${year}` : '';
    return this.apiService.get<ArticleStockHistory[]>(
      `articles/${id}/stock-history${params}`,
    );
  }
}

