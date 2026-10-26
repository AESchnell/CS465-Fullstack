import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TripFormComponent } from '../trip-form/trip-form.component';
import { TripDataService } from '../services/trip-data.service';
import { Trip } from '../models/trip';
@Component({ selector: 'app-edit-trip', imports: [TripFormComponent], templateUrl: './edit-trip.component.html', styleUrl: './edit-trip.component.css' })
export class EditTripComponent implements OnInit {
  private data = inject(TripDataService);
  private router = inject(Router);
  busy = signal(false);
  error = signal('');
  private route = inject(ActivatedRoute);
  trip = signal<Trip | null>(null);
  loading = signal(true);
  ngOnInit() { this.data.getTrip(this.route.snapshot.paramMap.get('code') || '').subscribe({ next: trip => { this.trip.set(trip); this.loading.set(false); }, error: err => { this.error.set(err.error?.message || 'Unable to load the trip.'); this.loading.set(false); } }); }
  save(trip: Trip) {
    this.busy.set(true); this.error.set('');
    this.data.updateTrip(trip).subscribe({ next: () => { void this.router.navigate(['/'], { queryParams: { saved: 'updated' } }); }, error: err => { this.error.set(err.error?.message || 'Unable to save the trip. Please try again.'); this.busy.set(false); } });
  }
}
