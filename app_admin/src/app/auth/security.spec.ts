import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { AuthenticationService } from '../services/authentication.service';
import { LoginComponent } from '../login/login.component';
import { TripListingComponent } from '../trip-listing/trip-listing.component';
import { TripCardComponent } from '../trip-card/trip-card.component';
import { TripFormComponent } from '../trip-form/trip-form.component';
import { authInterceptor } from './auth.interceptor';
import { authGuard } from './auth.guard';
const trip = {code:'TEST',name:'Test Trip',length:'3 nights',start:'2027-06-15',resort:'Test Resort',perPerson:'1299',image:'reef1.jpg',description:'Test trip'};
const token = (exp = Math.floor(Date.now()/1000)+3600) => `header.${btoa(JSON.stringify({name:'Mock Admin',email:'mock@example.test',exp}))}.signature`;
describe('administration security UI',()=>{
 beforeEach(()=>{
  sessionStorage.clear();
  TestBed.configureTestingModule({providers:[provideRouter([]),provideHttpClient(withInterceptors([authInterceptor])),provideHttpClientTesting()]});
 });
 afterEach(()=>{TestBed.inject(AuthenticationService).clear();TestBed.inject(HttpTestingController).verify();vi.restoreAllMocks();});
 it('hides card mutation controls when logged out and reveals them when authorized',async()=>{
  const fixture=TestBed.createComponent(TripCardComponent);fixture.componentRef.setInput('trip',trip);fixture.detectChanges();await fixture.whenStable();
  expect(fixture.nativeElement.textContent).not.toContain('Edit trip');expect(fixture.nativeElement.querySelector('button')).toBeNull();
  fixture.componentRef.setInput('canEdit',true);fixture.detectChanges();expect(fixture.nativeElement.textContent).toContain('Edit trip');expect(fixture.nativeElement.textContent).toContain('Delete');
 });
 it('login enables listing CRUD controls and logout hides them',async()=>{
  const fixture=TestBed.createComponent(TripListingComponent);fixture.detectChanges();const http=TestBed.inject(HttpTestingController);http.expectOne('/api/trips').flush([trip]);fixture.detectChanges();await fixture.whenStable();
  expect(fixture.nativeElement.textContent).not.toContain('Add trip');expect(fixture.nativeElement.textContent).not.toContain('Edit trip');expect(fixture.nativeElement.textContent).not.toContain('Delete');
  const auth=TestBed.inject(AuthenticationService);auth.login('mock@example.test','password').subscribe();http.expectOne('/api/login').flush({token:token()});fixture.detectChanges();await fixture.whenStable();
  expect(fixture.nativeElement.textContent).toContain('Add trip');expect(fixture.nativeElement.textContent).toContain('Edit trip');expect(fixture.nativeElement.textContent).toContain('Delete');
  vi.spyOn(TestBed.inject(Router),'navigate').mockResolvedValue(true);auth.logout();fixture.detectChanges();expect(fixture.nativeElement.textContent).not.toContain('Add trip');expect(fixture.nativeElement.textContent).not.toContain('Edit trip');expect(fixture.nativeElement.textContent).not.toContain('Delete');
 });
 it('submits the login form, establishes a session and navigates to trips',async()=>{
  const navigate=vi.spyOn(TestBed.inject(Router),'navigateByUrl').mockResolvedValue(true);
  const fixture=TestBed.createComponent(LoginComponent);fixture.detectChanges();
  for(const [id,value] of [['email','mock@example.test'],['password','mock password']]) {const input=fixture.nativeElement.querySelector('#'+id);input.value=value;input.dispatchEvent(new Event('input'));}
  fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));fixture.detectChanges();
  const request=TestBed.inject(HttpTestingController).expectOne('/api/login');expect(request.request.body).toEqual({email:'mock@example.test',password:'mock password'});expect(request.request.headers.has('Authorization')).toBe(false);
  request.flush({token:token()});await fixture.whenStable();
  expect(TestBed.inject(AuthenticationService).isLoggedIn()).toBe(true);expect(navigate).toHaveBeenCalledWith('/');expect(fixture.componentInstance.form.controls.password.value).toBe('');
 });
 it('shows failed login feedback and keeps controls locked',async()=>{
  const fixture=TestBed.createComponent(LoginComponent);fixture.detectChanges();fixture.componentInstance.form.setValue({email:'mock@example.test',password:'wrong'});fixture.componentInstance.submit();
  TestBed.inject(HttpTestingController).expectOne('/api/login').flush({message:'Email or password is incorrect.'},{status:401,statusText:'Unauthorized'});fixture.detectChanges();await fixture.whenStable();
  expect(fixture.nativeElement.textContent).toContain('Email or password is incorrect.');expect(TestBed.inject(AuthenticationService).isLoggedIn()).toBe(false);
 });
 it('attaches the token only to local API requests and clears it on a 401',()=>{
  const auth=TestBed.inject(AuthenticationService);auth.login('mock@example.test','password').subscribe();const value=token();
  const http=TestBed.inject(HttpTestingController);http.expectOne('/api/login').flush({token:value});
  const client=TestBed.inject(HttpClient);client.get('/api/trips').subscribe();const api=http.expectOne('/api/trips');expect(api.request.headers.get('Authorization')).toBe('Bearer '+value);api.flush([]);
  client.get('https://example.test/api/trips').subscribe();const external=http.expectOne('https://example.test/api/trips');expect(external.request.headers.has('Authorization')).toBe(false);external.flush([]);
  vi.spyOn(TestBed.inject(Router),'navigate').mockResolvedValue(true);
  client.post('/api/trips',trip).subscribe({error:()=>{}});http.expectOne('/api/trips').flush({},{status:401,statusText:'Unauthorized'});expect(auth.isLoggedIn()).toBe(false);expect(sessionStorage.getItem('travlr-token')).toBeNull();
 });
 it('discards an expired stored token',()=>{
  sessionStorage.setItem('travlr-token',token(1));const auth=TestBed.inject(AuthenticationService);expect(auth.isLoggedIn()).toBe(false);expect(auth.getToken()).toBeNull();
 });
 it('redirects anonymous edit navigation to login',()=>{
  const result=TestBed.runInInjectionContext(()=>authGuard({} as never,{url:'/edit-trip/TEST'} as never));
  expect(result instanceof UrlTree).toBe(true);expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toContain('/login?returnUrl=');
 });
 it('verifies the session on the server before allowing a protected route',async()=>{
  const auth=TestBed.inject(AuthenticationService);auth.login('mock@example.test','password').subscribe();const http=TestBed.inject(HttpTestingController);http.expectOne('/api/login').flush({token:token()});
  const result=TestBed.runInInjectionContext(()=>authGuard({} as never,{url:'/add-trip'} as never)) as Observable<boolean>;
  const permitted=firstValueFrom(result);http.expectOne('/api/me').flush({name:'Mock Admin',email:'mock@example.test'});expect(await permitted).toBe(true);
 });
 it('serializes an edited numeric price from the real form control',async()=>{
  const fixture=TestBed.createComponent(TripFormComponent);fixture.componentRef.setInput('trip',trip);fixture.detectChanges();await fixture.whenStable();
  const emitted=vi.fn();fixture.componentInstance.saveTrip.subscribe(emitted);
  const input=fixture.nativeElement.querySelector('#perPerson');input.value='1349';input.dispatchEvent(new Event('input'));fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
  expect(emitted).toHaveBeenCalledWith({...trip,perPerson:'1349'});
 });
 it('logout removes the stored token and resets authentication state',()=>{
  const auth=TestBed.inject(AuthenticationService);auth.login('mock@example.test','password').subscribe();TestBed.inject(HttpTestingController).expectOne('/api/login').flush({token:token()});
  vi.spyOn(TestBed.inject(Router),'navigate').mockResolvedValue(true);auth.logout();expect(auth.isLoggedIn()).toBe(false);expect(sessionStorage.getItem('travlr-token')).toBeNull();
 });
});
