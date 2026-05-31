import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

const PIN_KEY = 'binance_pin';

@Injectable({ providedIn: 'root' })
export class PinLockService {
  readonly locked = signal(false);
  readonly hasPin = signal(sessionStorage.getItem(PIN_KEY) !== null);

  constructor(private readonly router: Router) {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.hasPin()) {
        this.locked.set(true);
      }
    });
  }

  setPin(pin: string): boolean {
    if (!/^\d{4}$/.test(pin)) {
      return false;
    }

    sessionStorage.setItem(PIN_KEY, pin);
    this.hasPin.set(true);
    this.locked.set(false);
    return true;
  }

  unlock(pin: string): boolean {
    if (sessionStorage.getItem(PIN_KEY) !== pin) {
      return false;
    }

    this.locked.set(false);
    return true;
  }

  forgotPin(): void {
    sessionStorage.clear();
    this.hasPin.set(false);
    this.locked.set(false);
    void this.router.navigateByUrl('/login');
  }
}
