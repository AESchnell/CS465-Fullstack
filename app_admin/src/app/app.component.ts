import { AuthenticationService } from './services/authentication.service';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
@Component({ selector: 'app-root', imports: [RouterLink, RouterOutlet], templateUrl: './app.component.html', styleUrl: './app.component.css' })
export class AppComponent { auth = inject(AuthenticationService); }
