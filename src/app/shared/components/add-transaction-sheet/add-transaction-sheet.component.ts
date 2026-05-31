import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideArrowDownToLine, LucideArrowUpFromLine } from '@lucide/angular';
import { Category, TransactionType } from '../../models/transaction.model';

@Component({
  selector: 'app-add-transaction-sheet',
  standalone: true,
  imports: [FormsModule, LucideArrowDownToLine, LucideArrowUpFromLine],
  template: `
    <form class="transaction-form" (ngSubmit)="submit()">
      <label class="amount-field">
        <span>₱</span>
        <input name="amount" type="number" inputmode="decimal" min="0" step="0.01" placeholder="0.00" [(ngModel)]="amount" required>
      </label>

      <div class="category-chips" aria-label="Category">
        @for (option of categories; track option) {
          <button type="button" [class.active]="category === option" (click)="category = option">
            {{ categoryLabel(option) }}
          </button>
        }
      </div>

      <input class="note-input" name="note" maxlength="42" placeholder="What's this for?" [(ngModel)]="note">

      @if (warning) {
        <p class="warning">This withdrawal will leave the shared balance at zero.</p>
      }

      @if (error) {
        <p class="form-error" role="alert">{{ error }}</p>
      }

      <button class="confirm-button" type="submit">
        @if (mode === 'deposit') {
          <svg lucideArrowDownToLine size="18" aria-hidden="true"></svg>
        } @else {
          <svg lucideArrowUpFromLine size="18" aria-hidden="true"></svg>
        }
        Confirm {{ mode === 'deposit' ? 'Savings' : 'Withdrawal' }}
      </button>
    </form>
  `,
  styles: `
    .transaction-form {
      display: grid;
      gap: 18px;
    }

    .amount-field {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: var(--ink);
      font-size: 2.25rem;
      font-weight: 800;
    }

    .amount-field input {
      width: 190px;
      border: 0;
      outline: 0;
      background: transparent;
      color: inherit;
      font-size: inherit;
      font-weight: inherit;
      text-align: center;
    }

    .category-chips {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 2px;
    }

    .category-chips button {
      min-height: 40px;
      flex: 0 0 auto;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: var(--muted-bg);
      color: var(--muted);
      padding: 0 14px;
      font-size: 0.82rem;
      font-weight: 800;
    }

    .category-chips .active {
      border-color: var(--primary);
      background: var(--primary-soft);
      color: var(--primary);
    }

    .note-input {
      min-height: 48px;
      border: 0;
      border-radius: 12px;
      background: var(--muted-bg);
      outline: 0;
      padding: 0 14px;
    }

    .confirm-button {
      display: inline-flex;
      min-height: 52px;
      align-items: center;
      justify-content: center;
      gap: 10px;
      border: 0;
      border-radius: 999px;
      background: var(--primary);
      color: white;
      font-size: 0.94rem;
      font-weight: 800;
    }
  `,
})
export class AddTransactionSheetComponent {
  @Input({ required: true }) mode: TransactionType = 'deposit';
  @Input({ required: true }) categories: Category[] = [];
  @Input({ required: true }) categoryLabel!: (category: Category) => string;
  @Input() error = '';
  @Input() warning = false;
  @Output() confirmTransaction = new EventEmitter<{ amount: number; note: string; category: Category }>();

  amount: number | null = null;
  note = '';
  category: Category = 'savings';

  submit(): void {
    navigator.vibrate?.(10);
    this.confirmTransaction.emit({
      amount: Number(this.amount),
      note: this.note,
      category: this.category,
    });
  }
}
