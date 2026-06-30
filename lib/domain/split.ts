export interface SessionInput {
  // Id buoi — dung de doi chieu voi settlement gan buoi. Khong bat buoc cho splitSession.
  id?: string;
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

  // Chia chinh xac, KHONG lam tron -> tong shares = total tuyet doi, khong co nguoi ganh phan du.
  const perHead = total / totalHeads;
  const shares: Record<string, number> = {};
  for (const id of input.attendeeIds) shares[id] = perHead * headOf(id);

  const net: Record<string, number> = {};
  const everyone = new Set([...input.attendeeIds, ...Object.keys(paid)]);
  for (const id of everyone) net[id] = (shares[id] ?? 0) - (paid[id] ?? 0);

  return { total, perHead, shares, paid, net };
}

export function computeBalances(
  sessions: SessionInput[],
  settlements: { memberId: string; amount: number; sessionId?: string | null }[]
): Record<string, number> {
  // Settlement gan buoi = co "da tat toan buoi do", KHONG phai so tien tru cung.
  // Tranh trung voi payment: neu buoi da danh dau tra thi bo qua net buoi do.
  const paid = new Set(
    settlements.filter((s) => s.sessionId).map((s) => `${s.memberId}:${s.sessionId}`)
  );
  const bal: Record<string, number> = {};
  for (const s of sessions) {
    const r = splitSession(s);
    for (const [id, v] of Object.entries(r.net)) {
      const contrib = s.id && paid.has(`${id}:${s.id}`) ? 0 : v;
      bal[id] = (bal[id] ?? 0) + contrib;
    }
  }
  // Chi settlement thu cong (khong gan buoi) moi tru theo so tien.
  for (const st of settlements) {
    if (st.sessionId) continue;
    bal[st.memberId] = (bal[st.memberId] ?? 0) - st.amount;
  }
  return bal;
}
