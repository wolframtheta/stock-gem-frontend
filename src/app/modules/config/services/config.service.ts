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

export interface PersonalizationType {
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

  getPersonalizationTypes(): Observable<PersonalizationType[]> {
    return this.api.get<PersonalizationType[]>(
      `${this.base}/personalization-types`,
    );
  }

  createPersonalizationType(name: string): Observable<PersonalizationType> {
    return this.api.post<PersonalizationType>(
      `${this.base}/personalization-types`,
      { name },
    );
  }

  updatePersonalizationType(
    id: string,
    name: string,
  ): Observable<PersonalizationType> {
    return this.api.patch<PersonalizationType>(
      `${this.base}/personalization-types/${id}`,
      { name },
    );
  }

  deletePersonalizationType(id: string): Observable<void> {
    return this.api.delete<void>(`${this.base}/personalization-types/${id}`);
  }
}
