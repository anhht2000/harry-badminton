import { roundTo1000 } from "./money";

export interface SessionInput {
  expenses: { amount: number }[];
  attendeeIds: string[];
  // So suat moi attendee (nguoi di kem). Khong co -> 1 suat/nguoi.
  attendeeCounts?: Record<string, number>;
  payments: { memberId: string; amount: number }[];
}
export interface SessionResult {
  total: number; perHead: number;
  shares: Record<string, number>;
  paid: Record<string, number>;
  net: Record<string, number>;
}

export function splitSession(input: SessionInput): SessionResult {
  const total = input.expenses.reduce((s, e) => s + e.amount, 0);
  const headOf = (id: string) => Math.max(1, Math.floor(input.attendeeCounts?.[id] ?? 1));
  const totalHeads = input.attendeeIds.reduce((s, id) => s + headOf(id), 0);
  const paid: Record<string, number> = {};
  for (const p of input.payments) paid[p.memberId] = (paid[p.memberId] ?? 0) + p.amount;

  if (input.attendeeIds.length === 0) return { total, perHead: 0, shares: {}, paid, net: {} };

  const perHead = roundTo1000(total / totalHeads);
  const shares: Record<string, number> = {};
  for (const id of input.attendeeIds) shares[id] = perHead * headOf(id);

  const remainder = total - perHead * totalHeads;
  const payerIds = input.payments.map((p) => p.memberId);
  const bearer = payerIds.find((id) => input.attendeeIds.includes(id)) ?? input.attendeeIds[0];
  shares[bearer] += remainder;

  const net: Record<string, number> = {};
  const everyone = new Set([...input.attendeeIds, ...Object.keys(paid)]);
  for (const id of everyone) net[id] = (shares[id] ?? 0) - (paid[id] ?? 0);

  return { total, perHead, shares, paid, net };
}

export function computeBalances(
  sessions: SessionInput[],
  settlements: { memberId: string; amount: number }[]
): Record<string, number> {
  const bal: Record<string, number> = {};
  for (const s of sessions) {
    const r = splitSession(s);
    for (const [id, v] of Object.entries(r.net)) bal[id] = (bal[id] ?? 0) + v;
  }
  for (const st of settlements) bal[st.memberId] = (bal[st.memberId] ?? 0) - st.amount;
  return bal;
}
