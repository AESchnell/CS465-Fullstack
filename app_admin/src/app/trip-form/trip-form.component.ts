import { Component, input, output, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Trip } from '../models/trip';
@Component({ selector: 'app-trip-form', imports: [ReactiveFormsModule, RouterLink], templateUrl: './trip-form.component.html' })
export class TripFormComponent implements OnInit {
  trip = input<Trip | null>(null);
  busy = input(false);
  saveTrip = output<Trip>();
  submitted = signal(false);
  private fb = inject(FormBuilder);
  form = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9_-]+$/)]],
    name: ['', Validators.required], length: ['', Validators.required],
    start: ['', Validators.required], resort: ['', Validators.required],
    perPerson: this.fb.control<number | null>(null, [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]),
    image: ['reef1.jpg', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/i)]],
    description: ['', Validators.required]
  });
  ngOnInit() { const trip = this.trip(); if (trip) this.form.patchValue({ ...trip, start: trip.start.slice(0, 10), perPerson: Number(trip.perPerson) }); }
  invalid(name: keyof typeof this.form.controls) { const field = this.form.controls[name]; return field.invalid && (field.touched || this.submitted()); }
  submit() { this.submitted.set(true); if (this.form.invalid || this.busy()) { this.form.markAllAsTouched(); return; } const value = this.form.getRawValue(); this.saveTrip.emit({ ...value, perPerson: String(value.perPerson) }); }
}
