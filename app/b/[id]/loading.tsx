// Skeleton hien ngay khi dieu huong toi trang nhom (sau khi luu/xoa buoi) -> cam giac tuc thi.
export default function BoardLoading() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-col gap-2">
        <div className="h-4 w-28 animate-pulse rounded bg-surface-2" />
        <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-2" />
      </header>

      <div className="h-10 w-full animate-pulse rounded-xl bg-surface-2" />

      <ul className="flex flex-col gap-3">
        {[0, 1, 2, 3].map((i) => (
          <li
            key={i}
            className="h-[88px] animate-pulse rounded-lg border border-line bg-surface shadow-card"
          />
        ))}
      </ul>
    </main>
  );
}
