export type UserId = 'partner1' | 'partner2';
export type TransactionType = 'deposit' | 'withdrawal';
export type Category = 'savings' | 'food' | 'rent' | 'bills' | 'transportation' | 'emergency' | 'others';
export type RecurringFrequency = 'weekly' | 'monthly';

export const CATEGORIES: Category[] = [
  'savings',
  'food',
  'rent',
  'bills',
  'transportation',
  'emergency',
  'others',
];

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  emoji?: string;
  deadline?: string;
  createdAt: string;
  achieved: boolean;
}

export interface RecurringRule {
  id: string;
  userId: UserId;
  label: string;
  amount: number;
  type: TransactionType;
  category: Category;
  frequency: RecurringFrequency;
  dayOfMonth?: number;
  dayOfWeek?: number;
  lastTriggered?: string;
}

export interface Transaction {
  id: string;
  userId: UserId;
  type: TransactionType;
  category: Category;
  amount: number;
  note?: string;
  date: string;
  isRecurring?: boolean;
  isSystemEvent?: boolean;
}

export interface AppState {
  transactions: Transaction[];
  goals: Goal[];
  recurringRules: RecurringRule[];
  lowBalanceThreshold: number | null;
}
