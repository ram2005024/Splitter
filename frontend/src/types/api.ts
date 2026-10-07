export interface APIResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    page?: number;
    page_size?: number;
    count?: number;
    total?: number;
    [key: string]: unknown;
  } | null;
}

export interface ErrorDetail {
  code: string;
  message: string;
  details?: unknown;
}

export interface ErrorResponse {
  success: false;
  message: string;
  error: ErrorDetail;
}

// User Models
export interface UserProfile {
  id: string;
  user_id: string;
  avatar_url?: string | null;
  phone_number?: string | null;
  default_currency: string;
  bio?: string | null;
  payment_handle?: string | null;
  notification_settings?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  is_verified: boolean;
  is_active: boolean;
  profile?: UserProfile | null;
  created_at: string;
}

// Auth Token Response
export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user?: User | null;
}

// Group Models
export type GroupType = "TRIP" | "HOME" | "COUPLE" | "PROJECT" | "OTHER";
export type MemberRole = "ADMIN" | "MEMBER";

export interface GroupMember {
  id: string;
  user_id: string;
  role: MemberRole;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  joined_at: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string | null;
  currency: string;
  group_type: GroupType;
  creator_id: string;
  invite_code: string;
  members_count: number;
  created_at: string;
}

export interface GroupDetail extends Group {
  members: GroupMember[];
}

// Expense Models
export type SplitType = "EQUAL" | "EXACT" | "PERCENTAGE" | "SHARES";

export type ExpenseCategory =
  | "GENERAL"
  | "FOOD_AND_DRINK"
  | "TRANSPORTATION"
  | "ENTERTAINMENT"
  | "UTILITIES"
  | "RENT"
  | "TRAVEL"
  | "GROCERIES"
  | "SHOPPING"
  | "HEALTH";

export interface ExpenseSplit {
  id: string;
  user_id: string;
  user_name: string;
  user_email?: string | null;
  amount_owed: number | string;
  percentage?: number | string | null;
  shares?: number | null;
}

export interface Expense {
  id: string;
  group_id: string;
  payer_id: string;
  payer_name: string;
  title: string;
  amount: number | string;
  currency: string;
  split_type: SplitType;
  category: ExpenseCategory;
  notes?: string | null;
  date: string;
  created_at: string;
  splits: ExpenseSplit[];
}

export interface SplitParticipantInput {
  user_id: string;
  amount_owed?: number | string | null;
  percentage?: number | string | null;
  shares?: number | null;
}

export interface ExpenseCreateRequest {
  title: string;
  amount: number;
  currency?: string;
  payer_id?: string | null;
  split_type: SplitType;
  category?: ExpenseCategory;
  notes?: string | null;
  date?: string | null;
  splits?: SplitParticipantInput[];
}

// Balance Models
export interface UserBalanceDetail {
  user_id: string;
  user_name: string;
  email: string;
  total_paid: number | string;
  total_owed: number | string;
  net_balance: number | string;
}

export interface GroupBalanceSummary {
  group_id: string;
  currency: string;
  total_group_spending: number | string;
  total_settled: number | string;
  balances: UserBalanceDetail[];
}

// Settlement Models
export interface Settlement {
  id: string;
  group_id: string;
  payer_id: string;
  payer_name: string;
  receiver_id: string;
  receiver_name?: string;
  amount: number | string;
  payment_method?: string | null;
  reference_note?: string | null;
  created_at: string;
}

export interface SettlementCreateRequest {
  receiver_id: string;
  amount: number;
  payment_method?: string | null;
  reference_note?: string | null;
}

export interface SimplifiedTransaction {
  payer_id: string;
  payer_name: string;
  receiver_id: string;
  receiver_name: string;
  amount: number | string;
}

export interface DebtSimplification {
  group_id: string;
  currency: string;
  simplified_transactions: SimplifiedTransaction[];
  total_transfers_needed: number;
}

// Activity Log Models
export interface ActivityLog {
  id: string;
  group_id: string;
  user_id: string;
  user_name?: string;
  action: string;
  details?: Record<string, unknown> | null;
  created_at: string;
}
