import "server-only";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif"
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Thiếu biến môi trường ${name}`);
  return value;
}

const globalForS3 = globalThis as unknown as { __s3?: S3Client };

function getClient(): S3Client {
  if (globalForS3.__s3) return globalForS3.__s3;
  const client = new S3Client({
    region: requireEnv("AWS_REGION"),
    credentials: {
      accessKeyId: requireEnv("AWS_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("AWS_SECRET_ACCESS_KEY")
    }
  });
  globalForS3.__s3 = client;
  return client;
}

function publicUrl(key: string): string {
  const base =
    process.env.S3_PUBLIC_BASE_URL ||
    `https://${requireEnv("S3_BUCKET")}.s3.${requireEnv("AWS_REGION")}.amazonaws.com`;
  return `${base.replace(/\/$/, "")}/${key}`;
}

export async function uploadImage(
  data: Buffer | Uint8Array,
  contentType: string,
  prefix: string
): Promise<{ url: string; key: string }> {
  const bucket = requireEnv("S3_BUCKET");
  const ext = EXT_BY_TYPE[contentType] ?? "bin";
  const key = `${prefix}/${crypto.randomUUID()}.${ext}`;

  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: data,
      ContentType: contentType,
      // Key la UUID bat bien -> cache vinh vien o browser/CDN/Next optimizer.
      CacheControl: "public, max-age=31536000, immutable"
    })
  );

  return { url: publicUrl(key), key };
}

export async function deleteImage(key: string): Promise<void> {
  const bucket = requireEnv("S3_BUCKET");
  try {
    await getClient().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch {
    // Bỏ qua lỗi đối tượng không tồn tại / đã xóa
  }
}
