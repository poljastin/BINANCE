import { CurrencyPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MonthlySummary } from '../../services/finance.service';

@Component({
  selector: 'app-monthly-snapshot',
  standalone: true,
  imports: [CurrencyPipe],
  template: `
    <button class="snapshot" type="button" (click)="expand.emit()">
      <span>
        <small>Saved this month</small>
        <strong>{{ summary.saved | currency: 'PHP' : 'symbol-narrow' : '1.0-0' }}</strong>
      </span>
      <span>
        <small>Withdrawn</small>
        <strong>{{ summary.withdrawn | currency: 'PHP' : 'symbol-narrow' : '1.0-0' }}</strong>
      </span>
      <span>
        <small>Net</small>
        <strong class="net" [class.negative]="summary.netChange < 0">
          {{ summary.netChange >= 0 ? '▲ ' : '▼ ' }}{{ summary.netChange >= 0 ? '+' : '' }}{{ summary.netChange | currency: 'PHP' : 'symbol-narrow' : '1.0-0' }}
        </strong>
      </span>
    </button>
  `,
  styles: `
    .snapshot {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 16px;
      background: white;
      padding: 16px 14px;
      text-align: center;
      animation: card-in 200ms ease-out both;
    }

    span {
      min-width: 0;
      padding: 2px 6px;
    }

    span + span {
      border-left: 1px solid var(--line-light);
    }

    small {
      display: block;
      margin-bottom: 6px;
      color: var(--muted-light);
      font-size: 0.64rem;
      font-weight: 700;
    }

    strong {
      display: block;
      color: var(--teal-strong);
      font-size: 0.84rem;
      font-weight: 900;
      overflow-wrap: anywhere;
    }

    span:nth-child(2) strong {
      color: var(--rose-mid);
    }

    .negative {
      color: var(--danger);
    }

    @keyframes card-in {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `,
})
export class MonthlySnapshotComponent {
  @Input({ required: true }) summary!: MonthlySummary;
  @Output() expand = new EventEmitter<void>();
}
