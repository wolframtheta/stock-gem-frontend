import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private readonly endpoint = 'users';

  constructor(private apiService: ApiService) {}

  getAll(): Observable<User[]> {
    return this.apiService.get<User[]>(this.endpoint);
  }

  getById(id: string): Observable<User> {
    return this.apiService.get<User>(`${this.endpoint}/${id}`);
  }

  create(user: Partial<User> & { password: string }): Observable<User> {
    return this.apiService.post<User>(this.endpoint, user);
  }

  update(
    id: string,
    user: Partial<User> & { password?: string },
  ): Observable<User> {
    return this.apiService.patch<User>(`${this.endpoint}/${id}`, user);
  }

  delete(id: string): Observable<void> {
    return this.apiService.delete<void>(`${this.endpoint}/${id}`);
  }
}
