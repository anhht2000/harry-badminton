# Dev-Team Report — Chia Tiền Thể Thao

Generated: 2026-06-29
Mode: auto-sequential, all Opus, parallel batches (max 3), commit thẳng main.
QA gate: công cụ khách quan (tsc --noEmit, vitest, next build, next lint) do orchestrator chạy mỗi wave + cuối phase.

## Tổng quan

| Phase | Tasks | Trạng thái |
|-------|-------|-----------|
| P0 Prep | 4 | done — scaffold, vitest, drizzle schema, db client, design tokens |
| P1 MVP | 16 | done — domain split/balance, auth, actions, queries, UI chính |
| P2 Complete | 6 | done — share page, import parser/reader/action/wizard, file mẫu |
| P3 Polish | 2 | done — dark mode toggle, final checks + eslint |
| Fix (post-review) | 2 | done — sửa/xóa buổi, guard member settlement |

28/28 task target hoàn thành. 0 skip, 0 fail.

## Build & Test

- typecheck (tsc --noEmit): PASS
- vitest: 21/21 PASS (money, split, balance, guard, import-parse)
- next build: PASS — 7 routes (/, /b/[id], /b/[id]/buoi, /b/[id]/buoi/[sessionId], /b/[id]/thanh-vien, /b/[id]/import, /s/[token], /api/auth)
- next lint (next/core-web-vitals): sạch

## FR coverage (29 functional)

Tất cả module FR implement: AUTH, BOARD, MEMBER, SESSION (gồm 006/007 sửa/xóa sau review), SPLIT, BALANCE, SETTLE, SHARE, IMPORT.

## Review findings (đã xử lý)

- [high] FR-SESSION-006/007 sửa/xóa buổi chưa reachable (route [sessionId] thiếu, updateSession/deleteSession dead code) → ĐÃ FIX: thêm route edit + edit mode cho SessionForm + nút xóa.
- [medium] addSettlement không verify memberId ∈ board (IDOR/integrity) → ĐÃ FIX: thêm guard member thuộc board.
- [medium] parseRows signature lệch SPEC §5.4 (members vs newMembers) → không phải runtime bug; import action dedup ở tầng DB. Logged spec-issue.
- [low] amount overflow > 2.1B (integer 32-bit PG): chưa chặn — đề xuất thêm bound < 2_000_000_000 sau.
- [low] RawRow duplicate (import-read vs import-parse) bridge bằng cast — không risk runtime.
- [low] formatDate lặp ở 3 file.

## Việc cần làm khi deploy (ngoài code)

- Tạo Vercel Postgres, set DATABASE_URL (pooled), AUTH_SECRET, AUTH_URL, GOOGLE_CLIENT_ID/SECRET.
- Chạy db:push hoặc db:migrate (schema đã generate ở drizzle/0000_*.sql).
- Cấu hình Google OAuth redirect callback.

## Open question chưa chốt (cần product quyết)

- OQ4 (SPEC): chính sách xóa member đã có buổi. Hiện FK ON DELETE CASCADE — xóa member sẽ cascade xóa attendee/payment liên quan, làm lệch lịch sử số dư buổi cũ. UI có cảnh báo (window.confirm) nhưng chưa chặn. Cân nhắc soft-delete hoặc chặn xóa nếu member có buổi.
