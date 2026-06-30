export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 25 * 1024 * 1024;

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
export const VIDEO_CONTENT_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const ALLOWED_VIDEO = new Set(VIDEO_CONTENT_TYPES);

export function validateImage(contentType: string, size: number): { ok: boolean; error?: string } {
  if (!ALLOWED.has(contentType)) {
    return { ok: false, error: "Định dạng ảnh không hỗ trợ (chỉ JPG, PNG, WebP, GIF)" };
  }
  if (size <= 0) {
    return { ok: false, error: "Tệp ảnh trống" };
  }
  if (size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "Ảnh quá lớn (tối đa 8MB)" };
  }
  return { ok: true };
}

export function validateVideo(contentType: string, size: number): { ok: boolean; error?: string } {
  if (!ALLOWED_VIDEO.has(contentType)) {
    return { ok: false, error: "Định dạng video không hỗ trợ (chỉ MP4, WebM, MOV)" };
  }
  if (size <= 0) {
    return { ok: false, error: "Tệp video trống" };
  }
  if (size > MAX_VIDEO_BYTES) {
    return { ok: false, error: "Video quá lớn (tối đa 25MB)" };
  }
  return { ok: true };
}

// Phan biet video voi anh trong album dua tren duoi file cua URL Blob.
export function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);
}
