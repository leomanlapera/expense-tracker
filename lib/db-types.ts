// Hand-rolled slim schema types. Replace with `supabase gen types typescript
// --project-id …` output once the CLI is linked. Only the columns the app
// reads/writes are typed; add fields as they're needed.

export type TxnType = "expense" | "income";

export type Profile = {
  id: string;
  display_name: string | null;
  currency: string;
  timezone: string;
  created_at: string;
};

export type Category = {
  id: string;
  user_id: string;
  name: string;
  icon: string | null;
  color: string | null;
  type: TxnType;
  archived: boolean;
};

export type Transaction = {
  id: string;
  user_id: string;
  category_id: string | null;
  type: TxnType;
  amount_minor: number;
  occurred_on: string;
  payment_method: string | null;
  note: string | null;
  tags: string[];
  receipt_path: string | null;
  recurring_rule_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Budget = {
  id: string;
  user_id: string;
  category_id: string;
  month: string;
  limit_minor: number;
};

export type RecurringInterval = "daily" | "weekly" | "monthly";

export type RecurringRule = {
  id: string;
  user_id: string;
  category_id: string | null;
  type: TxnType;
  amount_minor: number;
  interval: RecurringInterval;
  next_run_on: string;
  payment_method: string | null;
  note: string | null;
  tags: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
};
