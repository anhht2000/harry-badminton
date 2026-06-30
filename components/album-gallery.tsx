"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import type { BoardPhoto } from "@/lib/queries";
import { uploadBoardPhoto, addBoardVideo, deleteBoardPhoto } from "@/lib/actions/photos";
import { validateVideo } from "@/lib/domain/image";

interface AlbumGalleryProps {
  boardId: string;
  photos: BoardPhoto[];
  canDelete?: boolean;
}

type PhotoAction =
  | { type: "delete"; id: string }
  | { type: "add"; photo: BoardPhoto };

function photosReducer(state: BoardPhoto[], action: PhotoAction): BoardPhoto[] {
  if (action.type === "delete") return state.filter((p) => p.id !== action.id);
  if (action.type === "add") return [action.photo, ...state];
  return state;
}

export function AlbumGallery({ boardId, photos, canDelete = false }: AlbumGalleryProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [uploaderName, setUploaderName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<BoardPhoto | null>(null);
  const previewUrlsRef = useRef<Set<string>>(new Set());

  const [optimisticPhotos, applyOptimistic] = useOptimistic(photos, photosReducer);

  useEffect(() => {
    const current = previewUrlsRef.current;
    photos.forEach((p) => {
      if (current.has(p.url)) {
        URL.revokeObjectURL(p.url);
        current.delete(p.url);
      }
    });
  }, [photos]);

  useEffect(() => {
    const urls = previewUrlsRef.current;
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
      urls.clear();
    };
  }, []);

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    const name = uploaderName.trim();
    setError(null);

    startTransition(async () => {
      for (const file of list) {
        const isVideo = file.type.startsWith("video/");
        if (isVideo) {
          const check = validateVideo(file.type, file.size);
          if (!check.ok) {
            setError(check.error ?? "Video không hợp lệ");
            continue;
          }
        }

        const previewUrl = URL.createObjectURL(file);
        previewUrlsRef.current.add(previewUrl);
        const placeholder: BoardPhoto = {
          id: `preview-${Date.now()}-${Math.random()}`,
          url: previewUrl,
          uploaderName: name || null,
          createdAt: new Date(),
          kind: isVideo ? "video" : "image"
        };
        applyOptimistic({ type: "add", photo: placeholder });

        try {
          if (isVideo) {
            // Video: upload thang tu browser len Blob (server action gioi han ~4.5MB), roi ghi DB.
            const blob = await upload(`badminton/albums/${boardId}/${file.name}`, file, {
              access: "public",
              handleUploadUrl: "/api/album-media",
              clientPayload: JSON.stringify({ boardId })
            });
            await addBoardVideo(boardId, blob.url, name || undefined);
          } else {
            const fd = new FormData();
            fd.append("file", file);
            if (name) fd.append("uploaderName", name);
            await uploadBoardPhoto(boardId, fd);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Tải lên thất bại, thử lại sau");
        }
      }
      router.refresh();
    });

    e.target.value = "";
  }

  function handleDelete(photo: BoardPhoto) {
    if (!window.confirm("Xoá ảnh này khỏi album?")) return;
    setError(null);
    startTransition(async () => {
      applyOptimistic({ type: "delete", id: photo.id });
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
          Ảnh & Video
        </h2>
        <p className="text-sm text-muted">Ai cũng có thể tải ảnh, video (≤25MB) lên.</p>
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
          accept="image/*,video/*"
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
          {isPending ? "Đang tải…" : "Tải ảnh/video"}
        </button>
      </div>

      {error && (
        <p role="alert" className="px-1 text-sm text-danger">
          {error}
        </p>
      )}

      {optimisticPhotos.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-line bg-surface px-6 py-12 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-accent">
            <CameraIcon size={22} />
          </span>
          <p className="max-w-prose text-sm text-muted">
            Chưa có ảnh hay video nào. Tải lên cái đầu tiên.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
          {optimisticPhotos.map((photo) => {
            const isPreview = photo.id.startsWith("preview-");
            const isVideo = photo.kind === "video";
            return (
              <li key={photo.id} className="group relative">
                <button
                  type="button"
                  onClick={() => !isPreview && setLightbox(photo)}
                  disabled={isPreview}
                  aria-label={
                    isPreview
                      ? "Đang tải ảnh…"
                      : photo.uploaderName
                      ? `Xem ảnh của ${photo.uploaderName}`
                      : "Xem ảnh lớn"
                  }
                  className="relative block aspect-square w-full overflow-hidden rounded-md border border-line bg-surface-2 shadow-card outline-none transition-transform duration-[var(--dur-fast)] ease-soft hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-default disabled:hover:translate-y-0"
                >
                  {isVideo ? (
                    <video
                      src={photo.url}
                      muted
                      playsInline
                      preload="metadata"
                      className={`h-full w-full object-cover ${isPreview ? "opacity-60" : ""}`}
                    />
                  ) : isPreview ? (
                    <img
                      src={photo.url}
                      alt="Đang tải ảnh…"
                      className="h-full w-full object-cover opacity-60"
                    />
                  ) : (
                    <Image
                      src={photo.url}
                      alt={
                        photo.uploaderName
                          ? `Ảnh do ${photo.uploaderName} tải lên`
                          : "Ảnh trong album"
                      }
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                      className="object-cover"
                    />
                  )}
                  {isVideo && !isPreview && (
                    <span className="pointer-events-none absolute inset-0 grid place-items-center">
                      <span className="grid h-11 w-11 place-items-center rounded-full bg-black/50 text-white">
                        <PlayIcon />
                      </span>
                    </span>
                  )}
                  {isPreview && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <SpinnerIcon />
                    </span>
                  )}
                </button>

                {photo.uploaderName && (
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate rounded-b-md bg-gradient-to-t from-black/60 to-transparent px-2 py-1 text-xs font-medium text-white">
                    {photo.uploaderName}
                  </span>
                )}

                {canDelete && !isPreview && (
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
            );
          })}
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

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={photo.uploaderName ? `Ảnh của ${photo.uploaderName}` : "Ảnh"}
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
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
        {photo.kind === "video" ? (
          <video
            src={photo.url}
            controls
            autoPlay
            playsInline
            className="max-h-[80vh] w-auto rounded-md"
          />
        ) : (
          <img
            src={photo.url}
            alt={
              photo.uploaderName
                ? `Ảnh do ${photo.uploaderName} tải lên`
                : "Ảnh trong album"
            }
            className="max-h-[80vh] w-auto rounded-md object-contain"
          />
        )}
        {photo.uploaderName && (
          <figcaption className="text-sm text-white/80">
            {photo.uploaderName}
          </figcaption>
        )}
      </figure>
    </div>,
    document.body
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

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.5v13a1 1 0 0 0 1.5.87l11-6.5a1 1 0 0 0 0-1.74l-11-6.5A1 1 0 0 0 8 5.5Z" />
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

function SpinnerIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="animate-spin">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}
