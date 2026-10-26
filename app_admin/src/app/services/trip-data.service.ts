import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { Trip } from '../models/trip';

@Injectable({ providedIn: 'root' })
export class TripDataService {
  private http = inject(HttpClient);
  private url = '/api/trips';
  getTrips() { return this.http.get<Trip[]>(this.url); }
  getTrip(code: string) { return this.http.get<Trip[]>(`${this.url}/${encodeURIComponent(code)}`).pipe(map(trips => {
    if (!trips[0]) throw new Error('Trip not found.');
    return trips[0];
  })); }
  addTrip(trip: Trip) { return this.http.post<Trip>(this.url, trip); }
  updateTrip(trip: Trip) { return this.http.put<Trip>(`${this.url}/${encodeURIComponent(trip.code)}`, trip); }
  deleteTrip(code: string) { return this.http.delete<{ message: string }>(`${this.url}/${encodeURIComponent(code)}`); }
}
