import { Injectable } from '@angular/core';

declare global {
  interface Window {
    confetti?: (options?: Record<string, unknown>) => void;
  }
}

const CONFETTI_SRC = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js';

@Injectable({ providedIn: 'root' })
export class ConfettiService {
  private loading?: Promise<void>;

  celebrate(): void {
    void this.load().then(() => {
      window.confetti?.({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.72 },
        colors: ['#0F6E56', '#EF7B45', '#FFFFFF'],
      });
    });
  }

  private load(): Promise<void> {
    if (window.confetti) {
      return Promise.resolve();
    }

    if (this.loading) {
      return this.loading;
    }

    this.loading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = CONFETTI_SRC;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject();
      document.head.appendChild(script);
    });

    return this.loading;
  }
}
