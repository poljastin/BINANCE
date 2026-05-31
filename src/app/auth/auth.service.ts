import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UserId } from '../shared/models/transaction.model';

export interface Account {
  id: UserId;
  username: UserId;
  password: string;
  displayName: string;
  initials: string;
}

const SESSION_KEY = 'binance.currentUser';

export const ACCOUNTS: Account[] = [
  {
    id: 'partner1',
    username: 'partner1',
    password: 'binance1',
    displayName: 'Partner 1',
    initials: 'P1',
  },
  {
    id: 'partner2',
    username: 'partner2',
    password: 'binance2',
    displayName: 'Partner 2',
    initials: 'P2',
  },
];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUserId = signal<UserId | null>(this.readSession());

  readonly user = computed(() => {
    const userId = this.currentUserId();
    return ACCOUNTS.find((account) => account.id === userId) ?? null;
  });

  readonly isAuthenticated = computed(() => this.user() !== null);

  constructor(private readonly router: Router) {}

  login(username: string, password: string): boolean {
    const account = ACCOUNTS.find(
      (candidate) => candidate.username === username.trim() && candidate.password === password,
    );

    if (!account) {
      return false;
    }

    sessionStorage.setItem(SESSION_KEY, account.id);
    this.currentUserId.set(account.id);
    return true;
  }

  logout(): void {
    sessionStorage.removeItem(SESSION_KEY);
    this.currentUserId.set(null);
    void this.router.navigateByUrl('/login');
  }

  accountFor(userId: UserId): Account {
    return ACCOUNTS.find((account) => account.id === userId) ?? ACCOUNTS[0];
  }

  partnerFor(userId: UserId): Account {
    return ACCOUNTS.find((account) => account.id !== userId) ?? ACCOUNTS[1];
  }

  private readSession(): UserId | null {
    const value = sessionStorage.getItem(SESSION_KEY);
    return value === 'partner1' || value === 'partner2' ? value : null;
  }
}
