import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Zone {
  id?: number;
  name: string;
  description: string;
  postCode: number[];
  coordinates: number[][]; 
  lastUpdated?: Date;
  streets?: Street[];
}

export interface Street {
  id?: string;
  name: string;
  zoneId: number;
  zoneName?: string;
  isParkable: boolean;
  lastUpdated?: Date;
  coordinates: number[][]; // Array of [lng, lat] pairs
}

@Injectable({
  providedIn: 'root'
})
export class ZoneService {
  private baseUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  // Zone CRUD operations
  getAllZones(): Observable<Zone[]> {
    return this.http.get<Zone[]>(`${this.baseUrl}/zones`);
  }

  getZoneById(id: number): Observable<Zone> {
    return this.http.get<Zone>(`${this.baseUrl}/zones/${id}`);
  }

  createZone(zone: Zone): Observable<Zone> {
    return this.http.post<Zone>(`${this.baseUrl}/zones`, zone);
  }

  updateZone(id: number, zone: Zone): Observable<Zone> {
    return this.http.put<Zone>(`${this.baseUrl}/zones/${id}`, zone);
  }

  deleteZone(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/zones/${id}`);
  }

  // Street CRUD operations
  getAllStreets(): Observable<Street[]> {
    return this.http.get<Street[]>(`${this.baseUrl}/streets`);
  }

  getStreetById(id: string): Observable<Street> {
    return this.http.get<Street>(`${this.baseUrl}/streets/${id}`);
  }

  createStreet(street: Street): Observable<Street> {
    return this.http.post<Street>(`${this.baseUrl}/streets`, street);
  }

  updateStreet(id: string, street: Street): Observable<Street> {
    return this.http.put<Street>(`${this.baseUrl}/streets/${id}`, street);
  }

  deleteStreet(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/streets/${id}`);
  }
}
