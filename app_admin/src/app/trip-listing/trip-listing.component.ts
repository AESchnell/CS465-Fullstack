import { AuthenticationService } from '../services/authentication.service';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TripCardComponent } from '../trip-card/trip-card.component';
import { TripDataService } from '../services/trip-data.service';
import { Trip } from '../models/trip';
@Component({ selector: 'app-trip-listing', imports: [RouterLink, TripCardComponent], templateUrl: './trip-listing.component.html', styleUrl: './trip-listing.component.css' })
export class TripListingComponent implements OnInit {
  auth = inject(AuthenticationService);
  private data = inject(TripDataService);
  private route = inject(ActivatedRoute);
  trips = signal<Trip[]>([]);
  loading = signal(true);
  busy = signal(false);
  error = signal('');
  notice = signal('');
  pendingDelete = signal<Trip | null>(null);
  ngOnInit() {
    const action = this.route.snapshot.queryParamMap.get('saved');
    if (action === 'added' || action === 'updated') this.notice.set(`Trip ${action} successfully.`);
    this.load();
  }
  load() {
    this.loading.set(true); this.error.set('');
    this.data.getTrips().subscribe({ next: trips => { this.trips.set(trips); this.loading.set(false); }, error: () => { this.error.set('Unable to load trips. Check that the API server is running and try again.'); this.loading.set(false); } });
  }
  confirmDelete() {
    const trip = this.pendingDelete(); if (!trip || !this.auth.isLoggedIn()) return;
    this.busy.set(true); this.error.set('');
    this.data.deleteTrip(trip.code).subscribe({ next: () => {
      this.trips.update(trips => trips.filter(item => item.code !== trip.code));
      this.notice.set(`${trip.name} deleted.`); this.pendingDelete.set(null); this.busy.set(false);
    }, error: err => { this.error.set(err.error?.message || 'Unable to delete the trip. Please try again.'); this.busy.set(false); } });
  }
}
