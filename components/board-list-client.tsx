"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { UserBoard } from "@/lib/queries";

const ROLE_LABEL = {
  leader: "Trưởng nhóm",
  secretary: "Thư ký",
  member: "Thành viên"
} as const;

const STORAGE_KEY = "boards:favorites";

export function BoardListClient({ boards }: { boards: UserBoard[] }) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);

  // Yeu thich luu tren may nay (localStorage), khong dong bo giua thiet bi.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setFavorites(new Set(JSON.parse(raw) as string[]));
    } catch {
      // bo qua
    }
  }, []);

  function toggleFavorite(id: string) {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // bo qua
      }
      return next;
    });
  }

  const favCount = boards.filter((b) => favorites.has(b.id)).length;
  const hasFav = favCount > 0;
  // Khong co favorite -> hien het. Co favorite -> mac dinh chi favorite, bam "Xem tat ca" de xem het.
  const showingAll = showAll || !hasFav;
  const list = showingAll
    ? [...boards].sort(
        (a, b) => Number(favorites.has(b.id)) - Number(favorites.has(a.id))
      )
    : boards.filter((b) => favorites.has(b.id));

  return (
    <div className="flex flex-col gap-4">
      {hasFav && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {showingAll
              ? `Tất cả ${boards.length} nhóm`
              : `${favCount} nhóm yêu thích`}
          </p>
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 text-sm font-medium text-ink shadow-card transition-colors duration-[var(--dur-fast)] ease-soft hover:border-accent hover:text-accent"
          >
            {showingAll ? "Chỉ yêu thích" : `Xem tất cả (${boards.length})`}
          </button>
        </div>
      )}

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((board) => {
          const fav = favorites.has(board.id);
          return (
            <li key={board.id} className="relative">
              <Link
                href={`/b/${board.id}`}
                className="group flex h-full flex-col gap-4 rounded-lg border border-line bg-surface p-5 text-ink no-underline shadow-card transition-[transform,box-shadow,border-color] duration-[var(--dur-base)] ease-soft hover:-translate-y-0.5 hover:border-accent hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent">
                    <ShuttlecockMark />
                  </span>
                  {/* Cho trong cho nut sao (dat absolute o goc) */}
                  <span className="h-9 w-9" aria-hidden="true" />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="font-display text-lg font-semibold leading-snug text-ink">
                    {board.name}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="w-fit rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
                      {ROLE_LABEL[board.role]}
                    </span>
                    {!board.active && (
                      <span className="w-fit rounded-full border border-danger px-2 py-0.5 text-xs font-medium text-danger">
                        Bản nháp
                      </span>
                    )}
                  </div>
                </div>
              </Link>
              <button
                type="button"
                aria-label={fav ? "Bỏ yêu thích" : "Đánh dấu yêu thích"}
                aria-pressed={fav}
                onClick={() => toggleFavorite(board.id)}
                className={`absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full border transition-colors duration-[var(--dur-fast)] ease-soft ${
                  fav
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-line bg-surface text-muted hover:border-accent hover:text-accent"
                }`}
              >
                <StarIcon filled={fav} />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m12 3 2.9 5.9 6.1.9-4.5 4.4 1 6.1L12 17.7 6.5 20.3l1-6.1L3 9.8l6.1-.9L12 3Z" />
    </svg>
  );
}

function ShuttlecockMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21a3 3 0 0 0 3-3l.6-7.2L12 8l-3.6 2.8L9 18a3 3 0 0 0 3 3Z" />
      <path d="M9 18h6" />
      <path d="M12 8l1.5-4.5M12 8l-2-4M12 8l4 1M12 8l-4 1" />
    </svg>
  );
}
