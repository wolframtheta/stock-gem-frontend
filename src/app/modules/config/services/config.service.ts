import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface Collection {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleType {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ComposturaType {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private readonly base = 'config';

  constructor(private api: ApiService) {}

  // Collections
  getCollections(): Observable<Collection[]> {
    return this.api.get<Collection[]>(`${this.base}/collections`);
  }

  createCollection(name: string): Observable<Collection> {
    return this.api.post<Collection>(`${this.base}/collections`, { name });
  }

  updateCollection(id: string, name: string): Observable<Collection> {
    return this.api.patch<Collection>(`${this.base}/collections/${id}`, {
      name,
    });
  }

  deleteCollection(id: string): Observable<void> {
    return this.api.delete<void>(`${this.base}/collections/${id}`);
  }

  // Article types
  getArticleTypes(): Observable<ArticleType[]> {
    return this.api.get<ArticleType[]>(`${this.base}/article-types`);
  }

  createArticleType(name: string): Observable<ArticleType> {
    return this.api.post<ArticleType>(`${this.base}/article-types`, { name });
  }

  updateArticleType(id: string, name: string): Observable<ArticleType> {
    return this.api.patch<ArticleType>(`${this.base}/article-types/${id}`, {
      name,
    });
  }

  deleteArticleType(id: string): Observable<void> {
    return this.api.delete<void>(`${this.base}/article-types/${id}`);
  }

  // Compostura types
  getComposturaTypes(): Observable<ComposturaType[]> {
    return this.api.get<ComposturaType[]>(`${this.base}/compostura-types`);
  }

  createComposturaType(name: string): Observable<ComposturaType> {
    return this.api.post<ComposturaType>(
      `${this.base}/compostura-types`,
      { name },
    );
  }

  updateComposturaType(id: string, name: string): Observable<ComposturaType> {
    return this.api.patch<ComposturaType>(
      `${this.base}/compostura-types/${id}`,
      { name },
    );
  }

  deleteComposturaType(id: string): Observable<void> {
    return this.api.delete<void>(`${this.base}/compostura-types/${id}`);
  }
}
