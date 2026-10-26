import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
interface Session { token: string; name: string; email: string; exp: number; }
@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private key = 'travlr-token';
  private session = signal<Session | null>(null);
  private expiryTimer?: ReturnType<typeof setTimeout>;
  constructor() {
    const token = sessionStorage.getItem(this.key);
    if (token) this.setToken(token);
  }
  isLoggedIn() { const session = this.session(); return !!session && session.exp * 1000 > Date.now(); }
  name() { return this.session()?.name || ''; }
  getToken() { return this.isLoggedIn() ? this.session()!.token : null; }
  login(email: string, password: string) {
    return this.http.post<{ token: string }>('/api/login', { email, password }).pipe(tap(response => {
      if (!this.setToken(response.token)) throw new Error('The server returned an invalid session.');
    }));
  }
  verifySession() { return this.http.get<{ name: string; email: string }>('/api/me'); }
  private setToken(token: string) {
    try {
      const encoded = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(encoded), c => c.charCodeAt(0))));
      if (!Number.isFinite(payload.exp) || payload.exp * 1000 <= Date.now() || typeof payload.name !== 'string' || typeof payload.email !== 'string') throw new Error('Invalid session');
      // Decoding controls display only. The API verifies signatures and account existence.
      this.session.set({ token, name: payload.name, email: payload.email, exp: payload.exp });
      sessionStorage.setItem(this.key, token);
      clearTimeout(this.expiryTimer);
      this.expiryTimer = setTimeout(() => this.expire(), Math.min(payload.exp * 1000 - Date.now(), 3600000));
      return true;
    } catch { this.clear(); return false; }
  }
  clear() { clearTimeout(this.expiryTimer); this.session.set(null); sessionStorage.removeItem(this.key); }
  logout() { this.clear(); void this.router.navigate(['/']); }
  expire() { this.clear(); void this.router.navigate(['/login'], { queryParams: { expired: '1' } }); }
}
