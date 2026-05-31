import { Component, EventEmitter, Output } from '@angular/core';
import { LucideHistory, LucideMinus, LucidePlus, LucideTarget } from '@lucide/angular';

export type QuickAction = 'deposit' | 'withdrawal' | 'goal' | 'history';

@Component({
  selector: 'app-quick-actions',
  standalone: true,
  imports: [LucideHistory, LucideMinus, LucidePlus, LucideTarget],
  template: `
    <section class="quick-actions" aria-label="Quick actions">
      <button type="button" (click)="action.emit('deposit')">
        <span class="icon add"><svg lucidePlus size="20" aria-hidden="true"></svg></span>
        <span>Add</span>
      </button>
      <button type="button" (click)="action.emit('withdrawal')">
        <span class="icon withdraw"><svg lucideMinus size="20" aria-hidden="true"></svg></span>
        <span>Withdraw</span>
      </button>
      <button type="button" (click)="action.emit('goal')">
        <span class="icon goals"><svg lucideTarget size="20" aria-hidden="true"></svg></span>
        <span>Goals</span>
      </button>
      <button type="button" (click)="action.emit('history')">
        <span class="icon history"><svg lucideHistory size="20" aria-hidden="true"></svg></span>
        <span>History</span>
      </button>
    </section>
  `,
  styles: `
    .quick-actions {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
    }

    button {
      position: relative;
      display: flex;
      min-height: 80px;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 9px;
      overflow: hidden;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: white;
      color: var(--muted);
      font-size: 0.66rem;
      font-weight: 700;
      transition: transform 120ms ease;
    }

    button:active {
      transform: scale(0.94);
    }

    .icon {
      display: grid;
      width: 36px;
      height: 36px;
      place-items: center;
      border-radius: 10px;
    }

    .add {
      background: var(--teal-wash);
      color: var(--teal-strong);
    }

    .withdraw {
      background: var(--rose-wash);
      color: var(--rose-mid);
    }

    .goals {
      background: var(--violet-wash);
      color: var(--violet-strong);
    }

    .history {
      background: var(--amber-wash);
      color: var(--amber-strong);
    }
  `,
})
export class QuickActionsComponent {
  @Output() action = new EventEmitter<QuickAction>();
}
