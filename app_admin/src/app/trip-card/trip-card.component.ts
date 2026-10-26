import { Component, input, output } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Trip } from '../models/trip';
@Component({ selector: 'app-trip-card', imports: [CurrencyPipe, DatePipe, RouterLink], templateUrl: './trip-card.component.html', styleUrl: './trip-card.component.css' })
export class TripCardComponent {
  trip = input.required<Trip>();
  canEdit = input(false);
  busy = input(false);
  deleteTrip = output<Trip>();
}
