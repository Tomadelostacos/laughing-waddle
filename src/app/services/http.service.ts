import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import config from '../../assets/config.json';

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  authorizationBearerToken: string;
  httpOptionsJson: any;

  constructor(private httpClient: HttpClient) {
    this.authorizationBearerToken = '';
  }

  setHeaders(): void {
    this.httpOptionsJson = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + this.authorizationBearerToken,
      })
    };
  }

  protected getRequest<T>(url: string, param?: object): Observable<T> {
    return this.httpClient.get<T>(url);
  }

  protected getRequestWithHeader<T>(url: string, params?: any): Observable<any> {
    if (params !== undefined) {
      return this.httpClient.get<T>(url, { params, headers: this.httpOptionsJson.headers });
    } else {
      return this.httpClient.get<T>(url, this.httpOptionsJson);
    }
  }

  protected getFileWithHeader<Blob>(url: string, params?: any): Observable<any> {
    if (params !== undefined) {
      return this.httpClient.get<Blob>(url, {
        params,
        headers: this.httpOptionsJson.headers,
        responseType: 'blob' as 'json'
      });
    } else {
      return this.httpClient.get<Blob>(url, { ...this.httpOptionsJson, responseType: 'blob' as 'json' });
    }
  }

  protected postRequest(url: string, payload: any): Observable<any> {
    return this.httpClient.post(url, payload);
  }

  protected postRequestWithHeader<T>(url: string, payload?: any, params?: any): Observable<any> {
    if (params !== undefined) {
      return this.httpClient.post<T>(url, payload, { params, headers: this.httpOptionsJson.headers });
    } else {
      return this.httpClient.post<T>(url, payload, this.httpOptionsJson);
    }
  }

  protected patchRequest(url: string, payload: any): Observable<any> {
    return this.httpClient.patch(url, payload);
  }

  protected patchRequestWithHeader(url: string, payload: any): Observable<any> {
    return this.httpClient.patch(url, payload, this.httpOptionsJson);
  }
}
