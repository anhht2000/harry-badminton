import "server-only";
import { put, del } from "@vercel/blob";

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif"
};

export async function uploadImage(
  data: Buffer | Uint8Array,
  contentType: string,
  prefix: string
): Promise<{ url: string; key: string }> {
  const ext = EXT_BY_TYPE[contentType] ?? "bin";
  const key = `${prefix}/${crypto.randomUUID()}.${ext}`;

  const blob = await put(key, data, {
    access: "public",
    contentType,
    // Pathname la UUID bat bien -> giu nguyen, khong them suffix ngau nhien.
    addRandomSuffix: false,
    // Cache vinh vien o browser/CDN/Next optimizer.
    cacheControlMaxAge: 31536000
  });

  return { url: blob.url, key };
}

// Nhan URL blob (hoac pathname) — del() cua @vercel/blob chap nhan ca hai.
export async function deleteImage(urlOrKey: string): Promise<void> {
  try {
    await del(urlOrKey);
  } catch {
    // Bỏ qua lỗi đối tượng không tồn tại / đã xóa
  }
}
