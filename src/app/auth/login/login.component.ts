import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideHeartHandshake, LucideLogIn, LucideShieldCheck } from '@lucide/angular';
import { TopBarComponent } from '../../shared/components/top-bar/top-bar.component';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, LucideHeartHandshake, LucideLogIn, LucideShieldCheck, TopBarComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  readonly error = signal('');
  username = '';
  password = '';

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      void this.router.navigateByUrl('/dashboard');
    }
  }

  signIn(): void {
    this.error.set('');

    if (this.authService.login(this.username, this.password)) {
      void this.router.navigateByUrl('/dashboard');
      return;
    }

    this.error.set('Username or password is incorrect.');
  }

  quickSelect(account: 'partner1' | 'partner2'): void {
    this.username = account;
    this.password = account === 'partner1' ? 'binance1' : 'binance2';
    this.error.set('');
  }
}
