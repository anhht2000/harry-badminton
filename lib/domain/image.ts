export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

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
