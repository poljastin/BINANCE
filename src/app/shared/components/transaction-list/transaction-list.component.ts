import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideArrowDownToLine,
  LucideArrowUpFromLine,
  LucideBadgeCheck,
  LucideDownload,
  LucideFilter,
  LucideHistory,
  LucideSearch,
} from '@lucide/angular';
import { AuthService } from '../../../auth/auth.service';
import { CATEGORIES, Category, Transaction, UserId } from '../../models/transaction.model';
import { AvatarComponent } from '../avatar/avatar.component';

type CategoryFilter = Category | 'all';

const CATEGORY_LABELS: Record<Category, string> = {
  savings: 'Savings',
  food: 'Food',
  rent: 'Rent',
  bills: 'Bills',
  transportation: 'Transportation',
  emergency: 'Emergency',
  others: 'Others',
};

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [
    AvatarComponent,
    CurrencyPipe,
    DatePipe,
    FormsModule,
    LucideArrowDownToLine,
    LucideArrowUpFromLine,
    LucideBadgeCheck,
    LucideDownload,
    LucideFilter,
    LucideHistory,
    LucideSearch,
    NgClass,
  ],
  template: `
    <section class="history" aria-label="Transaction history">
      <div class="section-heading">
        <h2>
          Recent transactions
        </h2>
        <button class="export-button" type="button" (click)="exportCsv.emit()">
          Filter
        </button>
      </div>

      <div class="history-filters">
        <label class="search-field">
          <svg lucideSearch size="17" aria-hidden="true"></svg>
          <input
            name="search"
            placeholder="Search notes or category"
            [ngModel]="searchTerm"
            (ngModelChange)="searchTermChange.emit($event)"
          >
        </label>
        <label class="select-field">
          <svg lucideFilter size="16" aria-hidden="true"></svg>
          <select
            name="categoryFilter"
            [ngModel]="selectedCategory"
            (ngModelChange)="selectedCategoryChange.emit($event)"
          >
            <option value="all">All</option>
            @for (option of categories; track option) {
              <option [value]="option">{{ categoryLabel(option) }}</option>
            }
          </select>
        </label>
      </div>

      @if (transactions.length) {
        <div class="transaction-list">
          @for (transaction of transactions; track transaction.id; let index = $index) {
            <article class="transaction" [class.system]="transaction.isSystemEvent" [style.animation-delay.ms]="index * 50">
              <span class="category-icon" [class.withdrawal-icon]="transaction.type === 'withdrawal'">
                @if (transaction.isSystemEvent) {
                  <svg lucideBadgeCheck size="17" aria-hidden="true"></svg>
                } @else if (transaction.type === 'deposit') {
                  <svg lucideArrowDownToLine size="17" aria-hidden="true"></svg>
                } @else {
                  <svg lucideArrowUpFromLine size="17" aria-hidden="true"></svg>
                }
              </span>

              <div class="transaction-main">
                <strong>{{ transaction.note || categoryLabel(transaction.category) }}</strong>
                <p>
                  {{ transaction.date | date: 'MMM d, h:mm a' }}
                  · by {{ transactionName(transaction) }}
                  @if (transaction.isRecurring) {
                    · Recurring
                  }
                </p>
              </div>

              <strong class="amount" [class.negative]="transaction.type === 'withdrawal'">
                {{ transaction.type === 'deposit' ? '+' : '-' }}{{ transaction.amount | currency: 'PHP' : 'symbol-narrow' : '1.2-2' }}
              </strong>
            </article>
          }
        </div>
      } @else if (totalTransactions) {
        <div class="empty-state">
          <p>No results</p>
        </div>
      } @else {
        <div class="empty-state">
          <p>No transactions yet. Start saving together! 💚</p>
        </div>
      }
    </section>
  `,
  styleUrl: './transaction-list.component.scss',
})
export class TransactionListComponent {
  readonly categories = CATEGORIES;

  @Input({ required: true }) transactions: Transaction[] = [];
  @Input({ required: true }) totalTransactions = 0;
  @Input({ required: true }) searchTerm = '';
  @Input({ required: true }) selectedCategory: CategoryFilter = 'all';
  @Output() searchTermChange = new EventEmitter<string>();
  @Output() selectedCategoryChange = new EventEmitter<CategoryFilter>();
  @Output() exportCsv = new EventEmitter<void>();

  constructor(private readonly authService: AuthService) {}

  categoryLabel(category: Category): string {
    return CATEGORY_LABELS[category];
  }

  transactionName(transaction: { userId: UserId; isSystemEvent?: boolean }): string {
    return transaction.isSystemEvent
      ? 'System'
      : this.authService.accountFor(transaction.userId).displayName;
  }
}
