import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthenticationService } from '../services/authentication.service';
@Component({ selector: 'app-login', imports: [ReactiveFormsModule, RouterLink], templateUrl: './login.component.html' })
export class LoginComponent {
  private auth = inject(AuthenticationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  busy = signal(false);
  error = signal('');
  expired = this.route.snapshot.queryParamMap.get('expired') === '1';
  form = this.fb.nonNullable.group({ email: ['', [Validators.required, Validators.email]], password: ['', Validators.required] });
  submit() {
    if (this.form.invalid || this.busy()) { this.form.markAllAsTouched(); return; }
    this.busy.set(true); this.error.set('');
    const value = this.form.getRawValue();
    this.auth.login(value.email.trim(), value.password).subscribe({
      next: () => {
        this.form.controls.password.reset();
        const target = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
        void this.router.navigateByUrl(target === '/add-trip' || target.startsWith('/edit-trip/') ? target : '/');
      },
      error: err => { this.error.set(err.error?.message || 'Unable to sign in. Check the server and try again.'); this.form.controls.password.reset(); this.busy.set(false); }
    });
  }
}
