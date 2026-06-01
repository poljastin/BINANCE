import { Injectable, computed, effect, signal } from '@angular/core';
import {
  AppState,
  Category,
  Goal,
  RecurringRule,
  Transaction,
  TransactionType,
  UserId,
} from '../models/transaction.model';
import { DatabaseService } from './database.service';

const LEGACY_STORAGE_KEY = 'binance.financeState';
const TRANSACTIONS_KEY = 'binance_transactions';
const GOALS_KEY = 'binance_goals';
const RECURRING_KEY = 'binance_recurring_rules';
const LOW_BALANCE_KEY = 'binance_low_balance_threshold';
const CLOUD_REFRESH_INTERVAL_MS = 3000;

export interface CategoryBreakdown {
  category: Category;
  total: number;
  percentage: number;
}

export interface MonthlySummary {
  saved: number;
  withdrawn: number;
  netChange: number;
  netChangePercent: number;
}

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private readonly state = signal<AppState>(this.readState());
  private readonly pendingRecurringCount = signal(0);
  private databaseHydrated = false;
  private cloudRefreshTimerId = 0;
  private readonly refreshFromDatabase = () => {
    if (document.visibilityState !== 'hidden') {
      void this.refreshSharedState();
    }
  };

  readonly transactions = computed(() =>
    [...this.state().transactions].sort(
      (first, second) => new Date(second.date).getTime() - new Date(first.date).getTime(),
    ),
  );

  readonly goals = computed(() => this.state().goals);
  readonly activeGoals = computed(() => this.goals().filter((goal) => !goal.achieved));
  readonly recurringRules = computed(() => this.state().recurringRules);
  readonly lowBalanceThreshold = computed(() => this.state().lowBalanceThreshold);
  readonly pendingRecurring = computed(() => this.pendingRecurringCount());

  readonly totalBalance = computed(() =>
    this.state().transactions.reduce((total, transaction) => {
      return transaction.type === 'deposit'
        ? total + transaction.amount
        : total - transaction.amount;
    }, 0),
  );

  readonly totalWithdrawals = computed(() =>
    this.state().transactions
      .filter((transaction) => transaction.type === 'withdrawal')
      .reduce((total, transaction) => total + transaction.amount, 0),
  );

  readonly partner1Balance = computed(() => this.balanceFor('partner1'));
  readonly partner2Balance = computed(() => this.balanceFor('partner2'));
  readonly lastUpdated = computed(() => this.transactions()[0]?.date ?? null);

  readonly categoryBreakdown = computed<CategoryBreakdown[]>(() => {
    const totals = new Map<Category, number>();
    const total = this.transactions()
      .filter((transaction) => !transaction.isSystemEvent)
      .reduce((sum, transaction) => {
        totals.set(transaction.category, (totals.get(transaction.category) ?? 0) + transaction.amount);
        return sum + transaction.amount;
      }, 0);

    return [...totals.entries()]
      .map(([category, categoryTotal]) => ({
        category,
        total: categoryTotal,
        percentage: total > 0 ? Math.round((categoryTotal / total) * 100) : 0,
      }))
      .sort((first, second) => second.total - first.total);
  });

  readonly monthlySummary = computed<MonthlySummary>(() => {
    const now = new Date();
    const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousEnd = new Date(now.getFullYear(), now.getMonth(), 1);
    const current = this.monthTotals(currentStart, now);
    const previous = this.monthTotals(previousStart, previousEnd);
    const netChange = current.saved - current.withdrawn;
    const previousNet = previous.saved - previous.withdrawn;
    const base = Math.abs(previousNet);

    return {
      saved: current.saved,
      withdrawn: current.withdrawn,
      netChange,
      netChangePercent: base > 0 ? Math.round(((netChange - previousNet) / base) * 100) : 0,
    };
  });

  constructor(private readonly database: DatabaseService) {
    void this.hydrateFromDatabase();
    window.addEventListener('focus', this.refreshFromDatabase);
    document.addEventListener('visibilitychange', this.refreshFromDatabase);
    this.cloudRefreshTimerId = window.setInterval(
      this.refreshFromDatabase,
      CLOUD_REFRESH_INTERVAL_MS,
    );

    effect(() => {
      const state = this.state();
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(state.transactions));
      localStorage.setItem(GOALS_KEY, JSON.stringify(state.goals));
      localStorage.setItem(RECURRING_KEY, JSON.stringify(state.recurringRules));
      localStorage.setItem(LOW_BALANCE_KEY, JSON.stringify(state.lowBalanceThreshold));

      if (this.databaseHydrated) {
        void this.database.saveFinanceState(state);
      }
    });
  }

  addSavings(userId: UserId, amount: number, note?: string, category: Category = 'savings'): Goal[] {
    return this.addTransaction({
      id: crypto.randomUUID(),
      userId,
      type: 'deposit',
      category,
      amount,
      note: this.cleanNote(note),
      date: new Date().toISOString(),
    });
  }

  withdraw(userId: UserId, amount: number, note?: string, category: Category = 'others'): Goal[] {
    if (amount > this.totalBalance()) {
      throw new Error('Withdrawal cannot exceed the shared balance.');
    }

    return this.addTransaction({
      id: crypto.randomUUID(),
      userId,
      type: 'withdrawal',
      category,
      amount,
      note: this.cleanNote(note),
      date: new Date().toISOString(),
    });
  }

  addGoal(name: string, targetAmount: number, emoji?: string, deadline?: string): void {
    if (this.activeGoals().length >= 5) {
      throw new Error('You can only have 5 active goals.');
    }

    this.state.update((state) => ({
      ...state,
      goals: [
        ...state.goals,
        {
          id: crypto.randomUUID(),
          name: name.trim(),
          targetAmount,
          emoji: this.cleanNote(emoji),
          deadline: this.cleanNote(deadline),
          createdAt: new Date().toISOString(),
          achieved: false,
        },
      ],
    }));
    this.markAchievedGoals();
  }

  addRecurringRule(rule: Omit<RecurringRule, 'id' | 'lastTriggered'>): void {
    this.state.update((state) => ({
      ...state,
      recurringRules: [...state.recurringRules, { ...rule, id: crypto.randomUUID() }],
    }));
  }

  deleteRecurringRule(id: string): void {
    this.state.update((state) => ({
      ...state,
      recurringRules: state.recurringRules.filter((rule) => rule.id !== id),
    }));
  }

  setLowBalanceThreshold(threshold: number | null): void {
    this.state.update((state) => ({ ...state, lowBalanceThreshold: threshold }));
  }

  balanceFor(userId: UserId): number {
    const deposits = this.totalDepositedBy(userId);
    const sharedWithdrawalShare = this.totalWithdrawals() / 2;

    return deposits - sharedWithdrawalShare;
  }

  totalDepositedBy(userId: UserId): number {
    return this.state().transactions
      .filter((transaction) => transaction.userId === userId && transaction.type === 'deposit' && !transaction.isSystemEvent)
      .reduce((total, transaction) => total + transaction.amount, 0);
  }

  totalWithdrawnBy(userId: UserId): number {
    return this.state().transactions
      .filter((transaction) => transaction.userId === userId && transaction.type === 'withdrawal' && !transaction.isSystemEvent)
      .reduce((total, transaction) => total + transaction.amount, 0);
  }

  exportCsv(): void {
    const headers = ['Date', 'User', 'Type', 'Category', 'Amount', 'Note'];
    const rows = this.transactions().map((transaction) => [
      transaction.date,
      transaction.isSystemEvent ? 'System' : transaction.userId,
      transaction.type,
      transaction.category,
      transaction.amount.toFixed(2),
      transaction.note ?? '',
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `binance-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private addTransaction(transaction: Transaction): Goal[] {
    let newlyAchieved: Goal[] = [];

    this.state.update((state) => ({
      ...state,
      transactions: [...state.transactions, transaction],
    }));

    if (!transaction.isSystemEvent) {
      newlyAchieved = this.markAchievedGoals(transaction.userId);
    }

    return newlyAchieved;
  }

  private markAchievedGoals(userId: UserId = 'partner1'): Goal[] {
    const balance = this.totalBalance();
    const achieved: Goal[] = [];

    this.state.update((state) => {
      const goals = state.goals.map((goal) => {
        if (!goal.achieved && balance >= goal.targetAmount) {
          const achievedGoal = { ...goal, achieved: true };
          achieved.push(achievedGoal);
          return achievedGoal;
        }

        return goal;
      });

      if (!achieved.length) {
        return state;
      }

      const systemTransactions = achieved.map((goal) => ({
        id: crypto.randomUUID(),
        userId,
        type: 'deposit' as TransactionType,
        category: 'savings' as Category,
        amount: 0,
        note: `Goal achieved: ${goal.name}`,
        date: new Date().toISOString(),
        isSystemEvent: true,
      }));

      return {
        ...state,
        goals,
        transactions: [...state.transactions, ...systemTransactions],
      };
    });

    return achieved;
  }

  private generateDueRecurringTransactions(): void {
    const now = new Date();
    let generated = 0;

    this.state.update((state) => {
      const transactions = [...state.transactions];
      const recurringRules = state.recurringRules.map((rule) => {
        const dueDate = this.dueDateFor(rule, now);
        const lastTriggered = rule.lastTriggered ? new Date(rule.lastTriggered) : null;

        if (!dueDate || dueDate > now || (lastTriggered && lastTriggered >= dueDate)) {
          return rule;
        }

        if (rule.type === 'withdrawal') {
          const balance = transactions.reduce((total, transaction) => (
            transaction.type === 'deposit' ? total + transaction.amount : total - transaction.amount
          ), 0);

          if (rule.amount > balance) {
            return rule;
          }
        }

        generated += 1;
        transactions.push({
          id: crypto.randomUUID(),
          userId: rule.userId,
          type: rule.type,
          category: rule.category,
          amount: rule.amount,
          note: rule.label,
          date: dueDate.toISOString(),
          isRecurring: true,
        });

        return { ...rule, lastTriggered: dueDate.toISOString() };
      });

      return { ...state, transactions, recurringRules };
    });

    this.pendingRecurringCount.set(generated);
    if (generated > 0) {
      this.markAchievedGoals();
    }
  }

  private dueDateFor(rule: RecurringRule, now: Date): Date | null {
    if (rule.frequency === 'weekly') {
      const dayOfWeek = rule.dayOfWeek ?? 1;
      const date = new Date(now);
      date.setDate(now.getDate() - ((now.getDay() - dayOfWeek + 7) % 7));
      date.setHours(9, 0, 0, 0);
      return date;
    }

    const dayOfMonth = Math.min(rule.dayOfMonth ?? 1, 28);
    const date = new Date(now.getFullYear(), now.getMonth(), dayOfMonth, 9, 0, 0, 0);

    if (date > now) {
      return new Date(now.getFullYear(), now.getMonth() - 1, dayOfMonth, 9, 0, 0, 0);
    }

    return date;
  }

  private monthTotals(start: Date, end: Date): { saved: number; withdrawn: number } {
    return this.state().transactions
      .filter((transaction) => {
        const date = new Date(transaction.date);
        return date >= start && date < end && !transaction.isSystemEvent;
      })
      .reduce(
        (totals, transaction) => ({
          saved: totals.saved + (transaction.type === 'deposit' ? transaction.amount : 0),
          withdrawn: totals.withdrawn + (transaction.type === 'withdrawal' ? transaction.amount : 0),
        }),
        { saved: 0, withdrawn: 0 },
      );
  }

  private cleanNote(note?: string): string | undefined {
    const trimmed = note?.trim();
    return trimmed ? trimmed : undefined;
  }

  private async hydrateFromDatabase(): Promise<void> {
    const storedState = await this.database.getFinanceState();

    if (storedState) {
      this.setMergedState(this.normalizeState(storedState));
    }

    this.databaseHydrated = true;
    this.generateDueRecurringTransactions();
    await this.database.saveFinanceState(this.state());
  }

  private async refreshSharedState(): Promise<void> {
    if (!this.databaseHydrated) {
      return;
    }

    const storedState = await this.database.getFinanceState();

    if (storedState) {
      this.setMergedState(this.normalizeState(storedState));
    }
  }

  private readState(): AppState {
    const legacy = this.readJson<Partial<AppState>>(LEGACY_STORAGE_KEY, {});
    const transactions = this.readJson<Transaction[]>(TRANSACTIONS_KEY, legacy.transactions ?? []);

    return this.normalizeState({
      transactions,
      goals: this.readJson<Goal[]>(GOALS_KEY, legacy.goals ?? []),
      recurringRules: this.readJson<RecurringRule[]>(RECURRING_KEY, legacy.recurringRules ?? []),
      lowBalanceThreshold: this.readJson<number | null>(
        LOW_BALANCE_KEY,
        legacy.lowBalanceThreshold ?? null,
      ),
    });
  }

  private normalizeState(state: Partial<AppState>): AppState {
    return {
      transactions: (state.transactions ?? []).map((transaction) => ({
        ...transaction,
        category: transaction.category ?? 'savings',
      })),
      goals: state.goals ?? [],
      recurringRules: state.recurringRules ?? [],
      lowBalanceThreshold: state.lowBalanceThreshold ?? null,
    };
  }

  private mergeStates(remote: AppState, local: AppState): AppState {
    return {
      transactions: this.mergeById(remote.transactions, local.transactions),
      goals: this.mergeById(remote.goals, local.goals),
      recurringRules: local.recurringRules.length ? local.recurringRules : remote.recurringRules,
      lowBalanceThreshold: local.lowBalanceThreshold ?? remote.lowBalanceThreshold,
    };
  }

  private setMergedState(remoteState: AppState): void {
    const mergedState = this.mergeStates(remoteState, this.state());

    if (this.serializeState(mergedState) !== this.serializeState(this.state())) {
      this.state.set(mergedState);
    }
  }

  private serializeState(state: AppState): string {
    return JSON.stringify({
      transactions: [...state.transactions].sort((first, second) => first.id.localeCompare(second.id)),
      goals: [...state.goals].sort((first, second) => first.id.localeCompare(second.id)),
      recurringRules: [...state.recurringRules].sort((first, second) => first.id.localeCompare(second.id)),
      lowBalanceThreshold: state.lowBalanceThreshold,
    });
  }

  private mergeById<T extends Transaction | Goal>(remoteItems: T[], localItems: T[]): T[] {
    const items = new Map<string, T>();

    for (const item of remoteItems) {
      items.set(item.id, item);
    }

    for (const item of localItems) {
      items.set(item.id, item);
    }

    return [...items.values()];
  }

  private readJson<T>(key: string, fallback: T): T {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) as T : fallback;
    } catch {
      return fallback;
    }
  }
}
