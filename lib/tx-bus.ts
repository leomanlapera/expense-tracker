// Pub-sub for "a transaction was just created" so pages showing lists can
// prepend it optimistically without waiting for the RSC refetch that
// revalidatePath triggers.
//
// The modal + form live in the (app) layout and can be submitted from any
// route; the list that wants to react (dashboard Recent) lives elsewhere.
// A tiny bus keeps them decoupled.

export type TxnCreatedRow = {
  id: string;
  type: "expense" | "income";
  amount_minor: number;
  occurred_on: string;
  note: string | null;
  category: { name: string | null; color: string | null } | null;
};

const listeners = new Set<(row: TxnCreatedRow) => void>();

export function notifyTxnCreated(row: TxnCreatedRow) {
  for (const fn of listeners) fn(row);
}

export function subscribeTxnCreated(fn: (row: TxnCreatedRow) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
