import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Goal } from '../../models/transaction.model';

@Component({
  selector: 'app-goal-card',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  template: `
    <article class="goal-card">
      <div class="goal-top">
        <span class="emoji">{{ goal.emoji || '✈️' }}</span>
        <div>
          <strong>{{ goal.name }}</strong>
          @if (goal.deadline) {
            <small>Due {{ goal.deadline | date: 'MMM y' }}</small>
          }
        </div>
        <em>{{ progress }}%</em>
      </div>
      <div class="progress-track">
        <i [style.width.%]="progress"></i>
      </div>
      <p><span>{{ balance | currency: 'PHP' : 'symbol-narrow' : '1.0-0' }} saved</span><span>of {{ goal.targetAmount | currency: 'PHP' : 'symbol-narrow' : '1.0-0' }}</span></p>
    </article>
  `,
  styles: `
    .goal-card {
      display: grid;
      width: 100%;
      gap: 11px;
      border: 1px solid var(--line);
      border-radius: 16px;
      background: white;
      padding: 14px 16px;
      animation: card-in 200ms ease-out both;
    }

    .goal-top {
      display: grid;
      grid-template-columns: 32px 1fr auto;
      align-items: center;
      gap: 12px;
    }

    .emoji {
      display: grid;
      width: 32px;
      height: 32px;
      place-items: center;
      border-radius: 8px;
      background: var(--violet-wash);
      font-size: 1rem;
    }

    strong {
      display: block;
      overflow: hidden;
      color: var(--ink);
      font-size: 0.86rem;
      font-weight: 900;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .progress-track {
      height: 6px;
      overflow: hidden;
      border-radius: 999px;
      background: var(--muted-bg);
    }

    i {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: var(--primary);
      animation: fill-in 400ms ease-out both;
    }

    p,
    small,
    em {
      margin: 0;
      color: var(--muted-light);
      font-size: 0.68rem;
      font-style: normal;
      font-weight: 800;
    }

    p {
      display: flex;
      justify-content: space-between;
      gap: 10px;
    }

    p span:first-child {
      color: var(--muted);
    }

    em {
      color: var(--teal-strong);
      font-size: 0.86rem;
      font-weight: 900;
    }

    @keyframes card-in {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }

    @keyframes fill-in {
      from { width: 0; }
    }

    @media (prefers-reduced-motion: reduce) {
      .goal-card,
      i {
        animation: none;
      }
    }
  `,
})
export class GoalCardComponent {
  @Input({ required: true }) goal!: Goal;
  @Input({ required: true }) balance = 0;

  get progress(): number {
    return Math.min(Math.round((this.balance / this.goal.targetAmount) * 100), 100);
  }
}
