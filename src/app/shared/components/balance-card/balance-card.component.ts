import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, signal } from '@angular/core';
import { LucideWalletCards } from '@lucide/angular';

@Component({
  selector: 'app-balance-card',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, LucideWalletCards],
  template: `
    <section class="balance-card" aria-label="Shared balance">
      <div class="card-top">
        <div>
          <p class="eyebrow">Shared Balance</p>
          <h1 [class.shimmer]="shimmer()">{{ displayedBalance() | currency: 'PHP' : 'symbol-narrow' : '1.2-2' }}</h1>
        </div>
      </div>
      <p class="updated">
        Last updated:
        @if (lastUpdated) {
          {{ lastUpdated | date: 'MMM d, h:mm a' }}
        } @else {
          just now
        }
      </p>
      <div class="partner-pills">
        <span><i></i><b>Paul</b><strong>{{ partner1Contribution | currency: 'PHP' : 'symbol-narrow' : '1.0-0' }}</strong></span>
        <span class="partner-two"><i></i><b>Jemimah</b><strong>{{ partner2Contribution | currency: 'PHP' : 'symbol-narrow' : '1.0-0' }}</strong></span>
      </div>
    </section>
  `,
  styles: `
    .balance-card {
      position: relative;
      isolation: isolate;
      overflow: hidden;
      display: grid;
      gap: 16px;
      border-radius: 20px;
      background:
        radial-gradient(circle at 15% 10%, rgba(88, 214, 171, 0.16), transparent 34%),
        radial-gradient(circle at 85% 80%, rgba(124, 58, 237, 0.12), transparent 32%),
        linear-gradient(135deg, #18172d 0%, #1d1b34 48%, #12172a 100%);
      background-size: 160% 160%, 150% 150%, 100% 100%;
      color: white;
      padding: 20px 20px 22px;
      animation: card-in 200ms ease-out both, gradient-drift 10s ease-in-out infinite alternate;
    }

    .balance-card::before {
      position: absolute;
      inset: 0;
      z-index: -1;
      background:
        linear-gradient(110deg, transparent 0%, rgba(255, 255, 255, 0.045) 42%, transparent 68%);
      content: '';
      transform: translateX(-35%);
      animation: light-sweep 9s ease-in-out infinite;
    }

    .balance-card::after {
      position: absolute;
      inset: 1px;
      z-index: -1;
      border-radius: inherit;
      background: rgba(18, 18, 34, 0.34);
      content: '';
    }

    .card-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
    }

    .eyebrow {
      margin: 0 0 10px;
      color: var(--muted-light);
      font-size: 0.68rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    h1 {
      margin: 0;
      font-size: 1.95rem;
      font-weight: 700;
      line-height: 1.05;
      letter-spacing: -0.03em;
      overflow-wrap: anywhere;
    }

    .shimmer {
      background: linear-gradient(90deg, #fff, rgba(255,255,255,0.62), #fff);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      animation: shimmer 300ms ease-out;
    }

    .partner-pills {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-top: 2px;
    }

    .partner-pills span {
      display: grid;
      grid-template-columns: 8px 1fr;
      align-items: center;
      column-gap: 8px;
      min-height: 46px;
      border-radius: 999px;
      background: var(--hero-inner);
      color: white;
      padding: 5px 10px;
    }

    .partner-pills i {
      grid-row: 1 / 3;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--teal-soft);
    }

    .partner-two i {
      background: var(--rose-soft);
    }

    .partner-pills b {
      color: var(--muted-light);
      font-size: 0.65rem;
      font-weight: 700;
    }

    .partner-pills strong {
      color: var(--line-light);
      font-size: 0.78rem;
      font-weight: 900;
    }

    .updated {
      margin: 0;
      color: var(--muted);
      font-size: 0.72rem;
      font-weight: 700;
    }

    @keyframes shimmer {
      from { background-position: -80px 0; }
      to { background-position: 80px 0; }
    }

    @keyframes gradient-drift {
      from { background-position: 0% 30%, 100% 70%, center; }
      to { background-position: 100% 65%, 0% 35%, center; }
    }

    @keyframes light-sweep {
      0%, 35% { transform: translateX(-45%); opacity: 0; }
      55% { opacity: 1; }
      100% { transform: translateX(45%); opacity: 0; }
    }

    @keyframes card-in {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }

    @media (prefers-reduced-motion: reduce) {
      .balance-card,
      .balance-card::before,
      .shimmer {
        animation: none;
      }
    }
  `,
})
export class BalanceCardComponent implements OnChanges {
  @Input({ required: true }) balance = 0;
  @Input() lastUpdated: string | null = null;
  @Input() partner1Contribution = 0;
  @Input() partner2Contribution = 0;
  @Input() partner1Initials = 'P1';
  @Input() partner2Initials = 'P2';

  readonly displayedBalance = signal(0);
  readonly shimmer = signal(false);
  private animationFrame = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['balance']) {
      this.shimmer.set(true);
      window.setTimeout(() => this.shimmer.set(false), 300);
      this.animateBalance(this.displayedBalance(), this.balance);
    }
  }

  private animateBalance(from: number, to: number): void {
    cancelAnimationFrame(this.animationFrame);

    const startedAt = performance.now();
    const duration = 300;

    const step = (time: number) => {
      const progress = Math.min((time - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      this.displayedBalance.set(from + (to - from) * eased);

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(step);
      }
    };

    this.animationFrame = requestAnimationFrame(step);
  }
}
