"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { readImportFile } from "@/lib/import-read";
import { LoadingOverlay } from "@/components/loading-overlay";
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
    <>
      <LoadingOverlay show={isPending} label="Đang nhập…" />
      <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <label
          htmlFor="import-file"
          className="group relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-dashed border-line bg-surface-2 px-6 py-10 text-center transition-colors duration-[var(--dur-fast)] ease-soft hover:border-accent focus-within:border-accent"
        >
          <span className="grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-accent transition-transform duration-[var(--dur-base)] ease-soft group-hover:-translate-y-0.5">
            <UploadIcon />
          </span>
          <span className="flex flex-col gap-1">
            <span className="font-display text-base font-semibold text-ink">
              {fileName ? "Đổi file khác" : "Chọn file .xlsx hoặc .csv"}
            </span>
            <span className="text-sm text-muted">
              Nhấn để chọn file từ máy của bạn.
            </span>
          </span>
          <input
            id="import-file"
            type="file"
            accept=".xlsx,.csv"
            onChange={handleFile}
            disabled={isPending}
            className="sr-only"
          />
        </label>
        {fileName && (
          <p className="flex items-center gap-2 px-1 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 font-medium text-accent">
              <FileIcon />
              {fileName}
            </span>
          </p>
        )}
        {readError && (
          <p role="alert" className="px-1 text-sm text-danger">
            {readError}
          </p>
        )}
      </section>

      {parsed && (
        <>
          {parsed.errors.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="flex items-center gap-2 text-base font-semibold text-danger">
                <AlertIcon />
                Lỗi cần sửa ({parsed.errors.length})
              </h2>
              <ul className="flex flex-col gap-1.5 rounded-lg border border-danger/40 bg-danger/[0.06] p-4">
                {parsed.errors.map((err) => (
                  <li
                    key={`${err.row}-${err.message}`}
                    className="text-sm text-danger"
                  >
                    Dòng {err.row}: {err.message}
                  </li>
                ))}
              </ul>
              <p className="px-1 text-sm text-muted">
                Sửa file rồi tải lại để có thể nhập.
              </p>
            </section>
          )}

          {parsed.members.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="label-eyebrow">
                Thành viên mới ({parsed.members.length})
              </h2>
              <div className="flex flex-wrap gap-2">
                {parsed.members.map((name) => (
                  <span
                    key={name}
                    className="rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section className="flex flex-col gap-3">
            <h2 className="label-eyebrow">
              Buổi sẽ tạo ({parsed.sessions.length})
            </h2>
            {parsed.sessions.length === 0 ? (
              <p className="rounded-lg border border-dashed border-line bg-surface px-4 py-8 text-center text-sm text-muted">
                Không có buổi hợp lệ nào trong file.
              </p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {parsed.sessions.map((session) => (
                  <li
                    key={session.date}
                    className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-4 shadow-card"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-display font-semibold text-ink">
                        {session.date}
                      </span>
                      <span className="num shrink-0 font-semibold text-money">
                        {formatVnd(sessionTotal(session.expenses))}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent">
                        {session.expenses.length} khoản
                      </span>
                      <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent">
                        {session.attendeeNames.length} người
                      </span>
                    </div>
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

      {submitError && (
        <p role="alert" className="px-1 text-sm text-danger">
          {submitError}
        </p>
      )}
      {createdCount !== null && (
        <p className="flex items-center gap-2 rounded-lg border border-ok/40 bg-ok/[0.08] px-4 py-3 text-sm font-medium text-ok">
          <CheckIcon />
          Đã nhập {createdCount} buổi.
        </p>
      )}

      <button
        type="button"
        onClick={handleConfirm}
        disabled={!canConfirm}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-accent px-6 text-base font-semibold text-on-accent shadow-card transition-[transform,background-color] duration-[var(--dur-fast)] ease-soft hover:-translate-y-0.5 hover:bg-accent-2 disabled:translate-y-0 disabled:opacity-50"
      >
        {isPending ? "Đang nhập…" : "Xác nhận nhập"}
      </button>
    </div>
    </>
  );
}

function UploadIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
