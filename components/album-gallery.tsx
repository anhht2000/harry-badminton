"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { BoardPhoto } from "@/lib/queries";
import { uploadBoardPhoto, deleteBoardPhoto } from "@/lib/actions/photos";

interface AlbumGalleryProps {
  boardId: string;
  photos: BoardPhoto[];
  canDelete?: boolean;
}

export function AlbumGallery({ boardId, photos, canDelete = false }: AlbumGalleryProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [uploaderName, setUploaderName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<BoardPhoto | null>(null);

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    const name = uploaderName.trim();
    setError(null);

    startTransition(async () => {
      try {
        for (const file of list) {
          const fd = new FormData();
          fd.append("file", file);
          if (name) fd.append("uploaderName", name);
          await uploadBoardPhoto(boardId, fd);
        }
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Tải ảnh thất bại, thử lại sau");
      }
    });

    e.target.value = "";
  }

  function handleDelete(photo: BoardPhoto) {
    if (!window.confirm("Xoá ảnh này khỏi album?")) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteBoardPhoto(photo.id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Xoá ảnh thất bại, thử lại sau");
      }
    });
  }

  return (
    <section className="flex flex-col gap-4" aria-label="Album ảnh">
      <div className="flex flex-col gap-1">
        <p className="label-eyebrow">Album</p>
        <h2 className="font-display text-xl font-bold tracking-tight text-ink sm:text-2xl">
          Ảnh chung
        </h2>
        <p className="text-sm text-muted">Ai cũng có thể tải ảnh lên.</p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          value={uploaderName}
          onChange={(e) => setUploaderName(e.target.value)}
          placeholder="Tên của bạn (tuỳ chọn)"
          aria-label="Tên của bạn (tuỳ chọn)"
          disabled={isPending}
          className="h-11 flex-1 rounded-full border border-line bg-surface px-4 text-ink shadow-card outline-none transition-colors duration-[var(--dur-fast)] ease-soft placeholder:text-muted focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFiles}
          disabled={isPending}
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isPending}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full bg-accent px-5 font-medium text-on-accent shadow-card transition-[transform,background-color] duration-[var(--dur-fast)] ease-soft hover:-translate-y-0.5 hover:bg-accent-2 disabled:translate-y-0 disabled:opacity-60"
        >
          <CameraIcon />
          {isPending ? "Đang tải…" : "Tải ảnh lên"}
        </button>
      </div>

      {error && (
        <p role="alert" className="px-1 text-sm text-danger">
          {error}
        </p>
      )}

      {photos.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-line bg-surface px-6 py-12 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-accent">
            <CameraIcon size={22} />
          </span>
          <p className="max-w-prose text-sm text-muted">
            Chưa có ảnh nào. Tải ảnh đầu tiên lên.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
          {photos.map((photo) => (
            <li key={photo.id} className="group relative">
              <button
                type="button"
                onClick={() => setLightbox(photo)}
                aria-label={
                  photo.uploaderName
                    ? `Xem ảnh của ${photo.uploaderName}`
                    : "Xem ảnh lớn"
                }
                className="block w-full overflow-hidden rounded-md border border-line bg-surface-2 shadow-card outline-none transition-transform duration-[var(--dur-fast)] ease-soft hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <img
                  src={photo.url}
                  alt={
                    photo.uploaderName
                      ? `Ảnh do ${photo.uploaderName} tải lên`
                      : "Ảnh trong album"
                  }
                  loading="lazy"
                  className="aspect-square w-full object-cover"
                />
              </button>

              {photo.uploaderName && (
                <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate rounded-b-md bg-gradient-to-t from-black/60 to-transparent px-2 py-1 text-xs font-medium text-white">
                  {photo.uploaderName}
                </span>
              )}

              {canDelete && (
                <button
                  type="button"
                  onClick={() => handleDelete(photo)}
                  disabled={isPending}
                  aria-label="Xoá ảnh"
                  className="absolute right-1.5 top-1.5 grid h-8 w-8 place-items-center rounded-full border border-line bg-surface/90 text-muted shadow-card backdrop-blur transition-colors duration-[var(--dur-fast)] ease-soft hover:border-danger hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
                >
                  <TrashIcon />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {lightbox && <Lightbox photo={lightbox} onClose={() => setLightbox(null)} />}
    </section>
  );
}

interface LightboxProps {
  photo: BoardPhoto;
  onClose: () => void;
}

function Lightbox({ photo, onClose }: LightboxProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={photo.uploaderName ? `Ảnh của ${photo.uploaderName}` : "Ảnh"}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng"
        className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white outline-none transition-colors duration-[var(--dur-fast)] ease-soft hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <CloseIcon />
      </button>
      <figure
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full max-w-3xl flex-col items-center gap-3"
      >
        <img
          src={photo.url}
          alt={
            photo.uploaderName
              ? `Ảnh do ${photo.uploaderName} tải lên`
              : "Ảnh trong album"
          }
          className="max-h-[80vh] w-auto rounded-md object-contain"
        />
        {photo.uploaderName && (
          <figcaption className="text-sm text-white/80">
            {photo.uploaderName}
          </figcaption>
        )}
      </figure>
    </div>
  );
}

function CameraIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L19 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6M10 11v6M14 11v6" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
