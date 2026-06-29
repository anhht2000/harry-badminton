import { pgTable, text, integer, timestamp, primaryKey, boolean } from "drizzle-orm/pg-core";

const uuid = () => text("id").primaryKey().$defaultFn(() => crypto.randomUUID());

// --- Auth.js ---
export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"), email: text("email").unique(), emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image")
});
export const accounts = pgTable("accounts", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"), access_token: text("access_token"),
  expires_at: integer("expires_at"), token_type: text("token_type"), scope: text("scope"),
  id_token: text("id_token"), session_state: text("session_state")
}, (t) => ({ pk: primaryKey({ columns: [t.provider, t.providerAccountId] }) }));
export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull()
});
export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(), token: text("token").notNull(),
  expires: timestamp("expires", { mode: "date" }).notNull()
}, (t) => ({ pk: primaryKey({ columns: [t.identifier, t.token] }) }));

// --- Domain ---
export const boards = pgTable("boards", {
  id: uuid(),
  ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  shareToken: text("share_token").notNull().$defaultFn(() => crypto.randomUUID()),
  // false = da deactivate (draft). Chi truong nhom + super admin thay; an khoi list cong khai.
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow()
});
export const members = pgTable("members", {
  id: uuid(),
  boardId: text("board_id").notNull().references(() => boards.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  // Link toi account dang nhap (null = chua link). Dung cho phan quyen trong nhom.
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  // Vai tro: "secretary" (thu ky) | "member" (thanh vien). Truong nhom suy ra tu boards.ownerId.
  role: text("role").notNull().default("member")
});
export const photos = pgTable("photos", {
  id: uuid(),
  boardId: text("board_id").notNull().references(() => boards.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  key: text("key").notNull(),
  uploaderName: text("uploader_name"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow()
});
export const gameSessions = pgTable("game_sessions", {
  id: uuid(),
  boardId: text("board_id").notNull().references(() => boards.id, { onDelete: "cascade" }),
  date: text("date").notNull(),            // YYYY-MM-DD
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow()
});
export const expenses = pgTable("expenses", {
  id: uuid(),
  sessionId: text("session_id").notNull().references(() => gameSessions.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  amount: integer("amount").notNull()      // VND nguyen
});
export const attendees = pgTable("attendees", {
  sessionId: text("session_id").notNull().references(() => gameSessions.id, { onDelete: "cascade" }),
  memberId: text("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  // So suat 1 thanh vien chiu (vi co nguoi di kem) — vd A x2 = 2 suat. Mac dinh 1.
  count: integer("count").notNull().default(1)
}, (t) => ({ pk: primaryKey({ columns: [t.sessionId, t.memberId] }) }));
export const payments = pgTable("payments", {
  id: uuid(),
  sessionId: text("session_id").notNull().references(() => gameSessions.id, { onDelete: "cascade" }),
  memberId: text("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull()
});
export const settlements = pgTable("settlements", {
  id: uuid(),
  boardId: text("board_id").notNull().references(() => boards.id, { onDelete: "cascade" }),
  memberId: text("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  sessionId: text("session_id").references(() => gameSessions.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  date: text("date").notNull(),
  note: text("note")
});
