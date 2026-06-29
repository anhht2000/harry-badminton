// Seed dữ liệu mẫu "Quỹ đội bóng" (nguồn: file Excel Sheet6 + Sheet7).
// Chạy lại được nhiều lần: xoá board cùng tên của owner rồi tạo mới (cascade).
//
// Local:  npm run db:seed
// Deploy: node scripts/seed.mjs   (env DATABASE_URL đã có sẵn trên platform)
//
// Owner: mặc định lấy user đầu tiên trong DB; đặt SEED_OWNER_EMAIL để chỉ định.

if (process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
  process.env.POSTGRES_URL = process.env.DATABASE_URL;
}
const { sql } = await import("@vercel/postgres");
const { randomUUID } = await import("node:crypto");

const roundTo1000 = (n) => Math.round(n / 1000) * 1000;

const BOARD_NAME = "Quỹ đội bóng";

// Mỗi buổi: khoản chi + danh sách người tham gia (theo thứ tự).
// status: "paid" = đã đóng đủ phần (net 0) | "owe" = có chơi nhưng chưa đóng (đang nợ).
const SESSIONS = [
  { date: "2026-06-13", expenses: [["cầu", 150000], ["sân + nước", 200000]],
    people: [["Dương", "paid"], ["Quân", "paid"], ["Toàn", "paid"], ["Thành", "paid"], ["Hiếu", "paid"], ["Huy", "paid"]] },
  { date: "2026-06-15", expenses: [["cầu", 30000], ["sân + nước", 60000]],
    people: [["Dương", "paid"], ["Huy", "paid"]] },
  { date: "2026-06-21", expenses: [["cầu", 180000], ["sân + nước", 195000]],
    people: [["Quân", "paid"], ["Toàn", "paid"], ["Thành", "paid"], ["Hiếu", "paid"], ["Huy", "paid"], ["Trung Nháy", "paid"]] },
  { date: "2026-06-23", expenses: [["cầu", 120000], ["sân + nước", 150000]],
    people: [["Toàn", "owe"], ["Thành", "owe"], ["Hiếu", "owe"], ["Huy", "paid"], ["Tùng Anh", "paid"], ["Khách 1", "paid"], ["Khách 2", "paid"]] },
  { date: "2026-06-25", expenses: [["cầu", 180000], ["sân + nước", 175000]],
    people: [["Quân", "owe"], ["Toàn", "owe"], ["Thành", "owe"], ["Huy", "paid"], ["Khách 1", "paid"], ["Khách 2", "paid"]] },
  { date: "2026-06-27", expenses: [["cầu", 195000]],
    people: [["Dương", "owe"], ["Quân", "owe"], ["Toàn", "owe"], ["Thành", "owe"], ["Hiếu", "owe"], ["Huy", "paid"], ["Trung Nháy", "owe"], ["Tuấn Anh", "owe"]] },
];

// --- resolve owner ---
const ownerEmail = process.env.SEED_OWNER_EMAIL;
const owner = ownerEmail
  ? (await sql`select id from users where email = ${ownerEmail}`).rows[0]
  : (await sql`select id from users order by id limit 1`).rows[0];
if (!owner) {
  throw new Error(
    ownerEmail
      ? `Không tìm thấy user với email ${ownerEmail}`
      : "Chưa có user nào trong DB — đăng nhập Google một lần trước khi seed (hoặc đặt SEED_OWNER_EMAIL)."
  );
}

// --- reset board cũ cùng tên (cascade xoá members/sessions/...) ---
await sql`delete from boards where owner_id = ${owner.id} and name = ${BOARD_NAME}`;

// --- board ---
const boardId = randomUUID();
await sql`insert into boards (id, owner_id, name, share_token) values (${boardId}, ${owner.id}, ${BOARD_NAME}, ${randomUUID()})`;

// --- members (gom theo thứ tự xuất hiện) ---
const memberNames = [];
for (const s of SESSIONS) for (const [n] of s.people) if (!memberNames.includes(n)) memberNames.push(n);
const memberId = {};
for (const name of memberNames) {
  const id = randomUUID();
  await sql`insert into members (id, board_id, name) values (${id}, ${boardId}, ${name})`;
  memberId[name] = id;
}

// --- sessions + expenses + attendees + payments ---
for (const s of SESSIONS) {
  const sid = randomUUID();
  await sql`insert into game_sessions (id, board_id, date) values (${sid}, ${boardId}, ${s.date})`;

  for (const [label, amount] of s.expenses) {
    await sql`insert into expenses (id, session_id, label, amount) values (${randomUUID()}, ${sid}, ${label}, ${amount})`;
  }

  const attendees = s.people.map(([n]) => n);
  for (const n of attendees) {
    await sql`insert into attendees (session_id, member_id) values (${sid}, ${memberId[n]})`;
  }

  // chia tiền giống lib/domain/split.ts: perHead làm tròn 1000, người paid đầu tiên gánh phần lẻ
  const total = s.expenses.reduce((a, [, v]) => a + v, 0);
  const n = attendees.length;
  const perHead = roundTo1000(total / n);
  const remainder = total - perHead * n;
  const paidPeople = s.people.filter(([, st]) => st === "paid").map(([nm]) => nm);
  const bearer = paidPeople[0];
  for (const nm of paidPeople) {
    const amt = perHead + (nm === bearer ? remainder : 0);
    await sql`insert into payments (id, session_id, member_id, amount) values (${randomUUID()}, ${sid}, ${memberId[nm]}, ${amt})`;
  }
}

console.log(`Seed xong board "${BOARD_NAME}" (${boardId}) — ${memberNames.length} thành viên, ${SESSIONS.length} buổi.`);
