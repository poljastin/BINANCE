import { CurrencyPipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideBell,
  LucideCalendarSync,
  LucideChartNoAxesColumn,
  LucideChartPie,
  LucideDownload,
  LucideLock,
  LucideLogOut,
  LucidePartyPopper,
  LucideSettings,
  LucideTarget,
  LucideTrash2,
} from '@lucide/angular';
import { AuthService } from '../auth/auth.service';
import { AddTransactionSheetComponent } from '../shared/components/add-transaction-sheet/add-transaction-sheet.component';
import { BalanceCardComponent } from '../shared/components/balance-card/balance-card.component';
import { BottomNavAction, BottomNavComponent } from '../shared/components/bottom-nav/bottom-nav.component';
import { BottomSheetComponent } from '../shared/components/bottom-sheet/bottom-sheet.component';
import { GoalCardComponent } from '../shared/components/goal-card/goal-card.component';
import { MonthlySnapshotComponent } from '../shared/components/monthly-snapshot/monthly-snapshot.component';
import { QuickAction, QuickActionsComponent } from '../shared/components/quick-actions/quick-actions.component';
import { TopBarComponent } from '../shared/components/top-bar/top-bar.component';
import { TransactionListComponent } from '../shared/components/transaction-list/transaction-list.component';
import { CATEGORIES, Category, RecurringFrequency, TransactionType, UserId } from '../shared/models/transaction.model';
import { ConfettiService } from '../shared/services/confetti.service';
import { FinanceService } from '../shared/services/finance.service';
import { PinLockService } from '../shared/services/pin-lock.service';

type ActionMode = 'deposit' | 'withdrawal';
type SheetMode = ActionMode | 'goal' | 'recurring' | 'threshold' | 'split' | 'monthly' | 'pin' | 'settings' | 'reset' | 'celebration';
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
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    AddTransactionSheetComponent,
    BalanceCardComponent,
    BottomNavComponent,
    BottomSheetComponent,
    CurrencyPipe,
    FormsModule,
    GoalCardComponent,
    LucideBell,
    LucideCalendarSync,
    LucideChartNoAxesColumn,
    LucideChartPie,
    LucideDownload,
    LucideLock,
    LucideLogOut,
    LucidePartyPopper,
    LucideSettings,
    LucideTarget,
    LucideTrash2,
    MonthlySnapshotComponent,
    QuickActionsComponent,
    TopBarComponent,
    TransactionListComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  readonly categories = CATEGORIES;
  readonly user = this.authService.user;
  readonly transactions = this.financeService.transactions;
  readonly totalBalance = this.financeService.totalBalance;
  readonly lastUpdated = this.financeService.lastUpdated;
  readonly goals = this.financeService.goals;
  readonly activeGoals = this.financeService.activeGoals;
  readonly recurringRules = this.financeService.recurringRules;
  readonly pendingRecurring = this.financeService.pendingRecurring;
  readonly categoryBreakdown = this.financeService.categoryBreakdown;
  readonly monthlySummary = this.financeService.monthlySummary;
  readonly lowBalanceThreshold = this.financeService.lowBalanceThreshold;
  readonly locked = this.pinLockService.locked;
  readonly hasPin = this.pinLockService.hasPin;

  readonly activeSheet = signal<SheetMode | null>(null);
  readonly formError = signal('');
  readonly searchTerm = signal('');
  readonly selectedCategory = signal<CategoryFilter>('all');
  readonly dismissedLowAlert = signal(sessionStorage.getItem('binance_low_balance_dismissed') === 'true');
  readonly celebrationGoalName = signal('');
  readonly pinError = signal('');

  amount: number | null = null;
  note = '';
  category: Category = 'savings';

  goalName = '';
  goalTarget: number | null = null;
  goalEmoji = '';
  goalDeadline = '';

  recurringLabel = '';
  recurringAmount: number | null = null;
  recurringType: TransactionType = 'deposit';
  recurringCategory: Category = 'savings';
  recurringFrequency: RecurringFrequency = 'monthly';
  recurringDayOfMonth = 1;
  recurringDayOfWeek = 1;

  threshold: number | null = null;
  pinSetup = '';
  pinInput = '';
  resetPaulPassword = '';
  resetJemimahPassword = '';
  resetConfirmText = '';
  resetSubmitting = false;

  readonly partner = computed(() => {
    const user = this.user();
    return user ? this.authService.partnerFor(user.id) : null;
  });

  readonly myContribution = computed(() => {
    const user = this.user();
    return user ? this.balanceFor(user.id) : 0;
  });

  readonly partnerContribution = computed(() => {
    const partner = this.partner();
    return partner ? this.balanceFor(partner.id) : 0;
  });

  readonly goalToFeature = computed(() => this.activeGoals()[0] ?? this.goals()[0] ?? null);

  readonly filteredTransactions = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    const category = this.selectedCategory();

    return this.transactions().filter((transaction) => {
      const matchesCategory = category === 'all' || transaction.category === category;
      const matchesSearch = !search
        || transaction.note?.toLowerCase().includes(search)
        || this.categoryLabel(transaction.category).toLowerCase().includes(search);

      return matchesCategory && matchesSearch;
    });
  });

  readonly lowBalanceVisible = computed(() => {
    const threshold = this.lowBalanceThreshold();
    return threshold !== null
      && this.totalBalance() < threshold
      && !this.dismissedLowAlert();
  });

  readonly partner1DepositTotal = computed(() => this.financeService.totalDepositedBy('partner1'));
  readonly partner2DepositTotal = computed(() => this.financeService.totalDepositedBy('partner2'));
  readonly splitPartner1 = computed(() => {
    const total = this.partner1DepositTotal() + this.partner2DepositTotal();
    return total > 0 ? Math.round((this.partner1DepositTotal() / total) * 100) : 50;
  });
  readonly splitPartner2 = computed(() => 100 - this.splitPartner1());

  readonly sheetTitle = computed(() => {
    const sheet = this.activeSheet();
    const titles: Record<SheetMode, string> = {
      deposit: 'Add Savings',
      withdrawal: 'Withdraw',
      goal: 'Savings Goal',
      recurring: 'Recurring Transactions',
      threshold: 'Low Balance Alert',
      split: 'Contribution Split',
      monthly: 'Monthly Summary',
      pin: 'PIN Lock',
      settings: 'Settings',
      reset: 'Reset Binance',
      celebration: 'Goal Reached',
    };

    return sheet ? titles[sheet] : '';
  });

  constructor(
    private readonly authService: AuthService,
    readonly financeService: FinanceService,
    private readonly confettiService: ConfettiService,
    private readonly pinLockService: PinLockService,
  ) {}

  openSheet(sheet: SheetMode): void {
    this.activeSheet.set(sheet);
    this.formError.set('');
    this.pinError.set('');

    if (sheet === 'deposit' || sheet === 'withdrawal') {
      this.amount = null;
      this.note = '';
      this.category = sheet === 'deposit' ? 'savings' : 'others';
    }

    if (sheet === 'threshold') {
      this.threshold = this.lowBalanceThreshold();
    }

    if (sheet === 'reset') {
      this.resetPaulPassword = '';
      this.resetJemimahPassword = '';
      this.resetConfirmText = '';
    }
  }

  closeSheet(): void {
    this.activeSheet.set(null);
  }

  submitAction(): void {
    this.submitTransaction({
      amount: Number(this.amount),
      note: this.note,
      category: this.category,
    });
  }

  submitTransaction(payload: { amount: number; note: string; category: Category }): void {
    const user = this.user();
    const amount = Number(payload.amount);

    this.formError.set('');

    if (!user) {
      this.formError.set('Please sign in again.');
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      this.formError.set('Enter an amount greater than zero.');
      return;
    }

    if (this.activeSheet() === 'withdrawal' && amount > this.totalBalance()) {
      this.formError.set('Withdrawal cannot exceed the shared balance.');
      return;
    }

    const achieved = this.activeSheet() === 'deposit'
      ? this.financeService.addSavings(user.id, amount, payload.note, payload.category)
      : this.financeService.withdraw(user.id, amount, payload.note, payload.category);

    this.handleAchievedGoals(achieved);
    if (!achieved.length) {
      this.closeSheet();
    }
  }

  handleQuickAction(action: QuickAction): void {
    if (action === 'history') {
      this.scrollToHistory();
      return;
    }

    this.openSheet(action);
  }

  handleBottomNav(action: BottomNavAction): void {
    if (action === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (action === 'history') {
      this.scrollToHistory();
      return;
    }

    if (action === 'goals') {
      this.openSheet('goal');
      return;
    }

    this.openSheet('settings');
  }

  scrollToHistory(): void {
    document.querySelector('.history')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  submitGoal(): void {
    const target = Number(this.goalTarget);
    this.formError.set('');

    if (!this.goalName.trim()) {
      this.formError.set('Enter a goal name.');
      return;
    }

    if (!Number.isFinite(target) || target <= 0) {
      this.formError.set('Enter a target amount greater than zero.');
      return;
    }

    try {
      this.financeService.addGoal(this.goalName, target, this.goalEmoji, this.goalDeadline);
      this.goalName = '';
      this.goalTarget = null;
      this.goalEmoji = '';
      this.goalDeadline = '';
      this.closeSheet();
    } catch (error) {
      this.formError.set(error instanceof Error ? error.message : 'Unable to create goal.');
    }
  }

  submitRecurring(): void {
    const user = this.user();
    const amount = Number(this.recurringAmount);
    this.formError.set('');

    if (!user) {
      this.formError.set('Please sign in again.');
      return;
    }

    if (!this.recurringLabel.trim() || !Number.isFinite(amount) || amount <= 0) {
      this.formError.set('Add a label and amount greater than zero.');
      return;
    }

    this.financeService.addRecurringRule({
      userId: user.id,
      label: this.recurringLabel,
      amount,
      type: this.recurringType,
      category: this.recurringCategory,
      frequency: this.recurringFrequency,
      dayOfMonth: this.recurringFrequency === 'monthly' ? this.recurringDayOfMonth : undefined,
      dayOfWeek: this.recurringFrequency === 'weekly' ? this.recurringDayOfWeek : undefined,
    });

    this.recurringLabel = '';
    this.recurringAmount = null;
  }

  deleteRecurring(id: string): void {
    this.financeService.deleteRecurringRule(id);
  }

  saveThreshold(): void {
    const value = Number(this.threshold);
    this.financeService.setLowBalanceThreshold(Number.isFinite(value) && value > 0 ? value : null);
    sessionStorage.removeItem('binance_low_balance_dismissed');
    this.dismissedLowAlert.set(false);
    this.closeSheet();
  }

  dismissLowBalance(): void {
    sessionStorage.setItem('binance_low_balance_dismissed', 'true');
    this.dismissedLowAlert.set(true);
  }

  setPin(): void {
    if (!this.pinLockService.setPin(this.pinSetup)) {
      this.pinError.set('Enter a 4-digit PIN.');
      return;
    }

    this.pinSetup = '';
    this.closeSheet();
  }

  unlock(): void {
    if (!this.pinLockService.unlock(this.pinInput)) {
      this.pinError.set('Incorrect PIN.');
      return;
    }

    this.pinInput = '';
    this.pinError.set('');
  }

  forgotPin(): void {
    this.pinLockService.forgotPin();
  }

  exportCsv(): void {
    this.financeService.exportCsv();
  }

  async submitResetBinance(): Promise<void> {
    this.formError.set('');

    if (this.resetConfirmText.trim().toUpperCase() !== 'RESET BINANCE') {
      this.formError.set('Type RESET BINANCE to confirm.');
      return;
    }

    if (!this.authService.verifyPartnerPasswords(this.resetPaulPassword, this.resetJemimahPassword)) {
      this.formError.set('Both partner passwords are required.');
      return;
    }

    this.resetSubmitting = true;
    await this.financeService.resetBinance();
    this.resetSubmitting = false;
    this.resetPaulPassword = '';
    this.resetJemimahPassword = '';
    this.resetConfirmText = '';
    this.closeSheet();
  }

  zeroBalanceWarning(): boolean {
    return this.activeSheet() === 'withdrawal'
      && Number(this.amount) > 0
      && Number(this.amount) === this.totalBalance();
  }

  goalProgress(target: number): number {
    return Math.min(Math.round((this.totalBalance() / target) * 100), 100);
  }

  categoryLabel(category: Category): string {
    return CATEGORY_LABELS[category];
  }

  initialsFor(userId: UserId): string {
    return this.authService.accountFor(userId).initials;
  }

  nameFor(userId: UserId): string {
    return this.authService.accountFor(userId).displayName;
  }

  transactionName(transaction: { userId: UserId; isSystemEvent?: boolean }): string {
    return transaction.isSystemEvent ? 'System' : this.nameFor(transaction.userId);
  }

  logout(): void {
    this.authService.logout();
  }

  private handleAchievedGoals(goals: { name: string }[]): void {
    const goal = goals[0];

    if (!goal) {
      return;
    }

    this.celebrationGoalName.set(goal.name);
    this.confettiService.celebrate();
    this.activeSheet.set('celebration');
  }

  private balanceFor(userId: UserId): number {
    return userId === 'partner1'
      ? this.financeService.partner1Balance()
      : this.financeService.partner2Balance();
  }
}
