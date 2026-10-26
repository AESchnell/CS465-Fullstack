import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TripFormComponent } from '../trip-form/trip-form.component';
import { TripDataService } from '../services/trip-data.service';
import { Trip } from '../models/trip';
@Component({ selector: 'app-add-trip', imports: [TripFormComponent], templateUrl: './add-trip.component.html', styleUrl: './add-trip.component.css' })
export class AddTripComponent {
  private data = inject(TripDataService);
  private router = inject(Router);
  busy = signal(false);
  error = signal('');
  save(trip: Trip) {
    this.busy.set(true); this.error.set('');
    this.data.addTrip(trip).subscribe({ next: () => { void this.router.navigate(['/'], { queryParams: { saved: 'added' } }); }, error: err => { this.error.set(err.error?.message || 'Unable to save the trip. Please try again.'); this.busy.set(false); } });
  }
}
