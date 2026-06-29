"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { readImportFile } from "@/lib/import-read";
import { parseRows, type ParseResult } from "@/lib/domain/import-parse";
import { importSessions } from "@/lib/actions/import";
import { formatVnd } from "@/lib/domain/money";

function sessionTotal(expenses: { amount: number }[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

export function ImportWizard({ boardId }: { boardId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdCount, setCreatedCount] = useState<number | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setReadError(null);
    setSubmitError(null);
    setCreatedCount(null);
    if (!file) {
      setFileName(null);
      setParsed(null);
      return;
    }
    setFileName(file.name);
    try {
      const buffer = await file.arrayBuffer();
      const rows = readImportFile(buffer);
      const result = parseRows(rows as unknown as Parameters<typeof parseRows>[0]);
      setParsed(result);
    } catch {
      setParsed(null);
      setReadError("Không đọc được file. Kiểm tra định dạng .xlsx hoặc .csv.");
    }
  }

  function handleConfirm() {
    if (!parsed || parsed.errors.length > 0) return;
    setSubmitError(null);
    startTransition(async () => {
      try {
        const { created } = await importSessions(boardId, parsed);
        setCreatedCount(created);
        router.push(`/b/${boardId}`);
      } catch {
        setSubmitError("Không nhập được dữ liệu, thử lại sau.");
      }
    });
  }

  const hasErrors = (parsed?.errors.length ?? 0) > 0;
  const canConfirm = !!parsed && !hasErrors && !isPending;

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-2">
        <label htmlFor="import-file" className="text-sm font-semibold">
          Chọn file (.xlsx hoặc .csv)
        </label>
        <input
          id="import-file"
          type="file"
          accept=".xlsx,.csv"
          onChange={handleFile}
          disabled={isPending}
          className="rounded-md border border-line bg-surface px-3 py-2 text-ink file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-on-accent disabled:opacity-60"
        />
        {fileName && (
          <p className="text-sm text-muted">Đã chọn: {fileName}</p>
        )}
        {readError && <p className="text-sm text-danger">{readError}</p>}
      </section>

      {parsed && (
        <>
          {parsed.errors.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="text-base text-danger">
                Lỗi cần sửa ({parsed.errors.length})
              </h2>
              <ul className="flex flex-col gap-1 rounded-md border border-danger/40 bg-surface p-3">
                {parsed.errors.map((err) => (
                  <li
                    key={`${err.row}-${err.message}`}
                    className="text-sm text-danger"
                  >
                    Dòng {err.row}: {err.message}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-muted">
                Sửa file rồi tải lại để có thể nhập.
              </p>
            </section>
          )}

          {parsed.members.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="text-base font-semibold">
                Thành viên ({parsed.members.length})
              </h2>
              <div className="flex flex-wrap gap-2">
                {parsed.members.map((name) => (
                  <span
                    key={name}
                    className="rounded-full border border-line bg-surface px-3 py-1 text-sm text-ink"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-semibold">
              Buổi sẽ tạo ({parsed.sessions.length})
            </h2>
            {parsed.sessions.length === 0 ? (
              <p className="text-sm text-muted">
                Không có buổi hợp lệ nào trong file.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {parsed.sessions.map((session) => (
                  <li
                    key={session.date}
                    className="flex flex-col gap-2 rounded-md border border-line bg-surface p-3 shadow-card"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-ink">
                        {session.date}
                      </span>
                      <span className="num text-money">
                        {formatVnd(sessionTotal(session.expenses))}
                      </span>
                    </div>
                    <p className="text-sm text-muted">
                      {session.expenses.length} khoản ·{" "}
                      {session.attendeeNames.length} người
                    </p>
                    <p className="text-sm text-muted">
                      {session.attendeeNames.join(", ")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {submitError && <p className="text-sm text-danger">{submitError}</p>}
      {createdCount !== null && (
        <p className="text-sm text-ok">Đã nhập {createdCount} buổi.</p>
      )}

      <button
        type="button"
        onClick={handleConfirm}
        disabled={!canConfirm}
        className="rounded-md bg-accent px-4 py-3 text-base font-semibold text-on-accent disabled:opacity-60"
      >
        {isPending ? "Đang nhập…" : "Xác nhận nhập"}
      </button>
    </div>
  );
}
