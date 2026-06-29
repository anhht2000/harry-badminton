export interface RawRow {
  ngày: string;
  khoản: string;
  "số tiền": string;
  "người ứng": string;
  "người tham gia": string;
}

export interface ParsedExpense {
  label: string;
  amount: number;
}
export interface ParsedPayment {
  memberName: string;
  amount: number;
}
export interface ParsedSession {
  date: string;
  expenses: ParsedExpense[];
  attendeeNames: string[];
  payments: ParsedPayment[];
}
export interface ParseError {
  row: number;
  message: string;
}
export interface ParseResult {
  sessions: ParsedSession[];
  errors: ParseError[];
  members: string[];
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

// "200.000đ" -> 200000; trả null nếu không phải số nguyên dương hợp lệ
function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/đ/gi, "").replace(/\./g, "").replace(/\s/g, "").trim();
  if (!/^\d+$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return n > 0 ? n : null;
}

function splitNames(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of raw.split(",")) {
    const trimmed = name.trim();
    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed);
      out.push(trimmed);
    }
  }
  return out;
}

interface SessionDraft {
  date: string;
  expenses: ParsedExpense[];
  attendeeOrder: string[];
  attendeeSet: Set<string>;
  paymentOrder: string[];
  paymentByName: Map<string, number>;
}

export function parseRows(rows: RawRow[]): ParseResult {
  const errors: ParseError[] = [];
  const drafts = new Map<string, SessionDraft>();
  const order: string[] = [];
  const members: string[] = [];
  const memberSet = new Set<string>();

  const addMember = (name: string) => {
    if (!memberSet.has(name)) {
      memberSet.add(name);
      members.push(name);
    }
  };

  rows.forEach((row, index) => {
    const rowNum = index + 1;
    const date = (row.ngày ?? "").trim();
    const label = (row.khoản ?? "").trim();
    const amountRaw = (row["số tiền"] ?? "").trim();
    const payer = (row["người ứng"] ?? "").trim();
    const attendeesRaw = (row["người tham gia"] ?? "").trim();

    const missing: string[] = [];
    if (!date) missing.push("ngày");
    if (!label) missing.push("khoản");
    if (!amountRaw) missing.push("số tiền");
    if (!payer) missing.push("người ứng");
    if (!attendeesRaw) missing.push("người tham gia");
    if (missing.length > 0) {
      errors.push({ row: rowNum, message: `Thiếu cột: ${missing.join(", ")}` });
      return;
    }

    if (!isValidDate(date)) {
      errors.push({ row: rowNum, message: `Ngày không đúng định dạng YYYY-MM-DD: ${date}` });
      return;
    }

    const amount = parseAmount(amountRaw);
    if (amount === null) {
      errors.push({ row: rowNum, message: `Số tiền không phải số nguyên dương: ${amountRaw}` });
      return;
    }

    const attendees = splitNames(attendeesRaw);
    if (attendees.length === 0) {
      errors.push({ row: rowNum, message: "Không có người tham gia" });
      return;
    }

    let draft = drafts.get(date);
    if (!draft) {
      draft = {
        date,
        expenses: [],
        attendeeOrder: [],
        attendeeSet: new Set(),
        paymentOrder: [],
        paymentByName: new Map()
      };
      drafts.set(date, draft);
      order.push(date);
    }

    draft.expenses.push({ label, amount });

    for (const name of attendees) {
      if (!draft.attendeeSet.has(name)) {
        draft.attendeeSet.add(name);
        draft.attendeeOrder.push(name);
      }
      addMember(name);
    }

    // người ứng phải có mặt: thêm vào attendees nếu chưa có
    if (!draft.attendeeSet.has(payer)) {
      draft.attendeeSet.add(payer);
      draft.attendeeOrder.push(payer);
    }
    addMember(payer);

    if (!draft.paymentByName.has(payer)) draft.paymentOrder.push(payer);
    draft.paymentByName.set(payer, (draft.paymentByName.get(payer) ?? 0) + amount);
  });

  const sessions: ParsedSession[] = order.map((date) => {
    const draft = drafts.get(date)!;
    return {
      date: draft.date,
      expenses: draft.expenses,
      attendeeNames: draft.attendeeOrder,
      payments: draft.paymentOrder.map((memberName) => ({
        memberName,
        amount: draft.paymentByName.get(memberName)!
      }))
    };
  });

  return { sessions, errors, members };
}
