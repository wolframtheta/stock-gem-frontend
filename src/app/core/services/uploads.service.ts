import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { uploadPublicPath } from '../utils/upload-public-path.util';

export interface UploadImageResponse {
  filename: string;
}

@Injectable({
  providedIn: 'root',
})
export class UploadsService {
  private readonly apiUrl = process.env.NG_APP_API_URL ?? 'http://localhost:3500/api';

  constructor(private http: HttpClient) {}

  uploadImage(file: File): Observable<UploadImageResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UploadImageResponse>(
      `${this.apiUrl}${uploadPublicPath()}`,
      formData,
    );
  }
}
