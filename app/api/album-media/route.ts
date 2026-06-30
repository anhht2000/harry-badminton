import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { requireBoardAccess } from "@/lib/access";
import { MAX_VIDEO_BYTES, VIDEO_CONTENT_TYPES } from "@/lib/domain/image";

// Cap token cho browser upload video THANG len Vercel Blob (server action gioi han ~4.5MB).
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const { boardId } = JSON.parse(clientPayload ?? "{}") as { boardId?: string };
        if (!boardId) throw new Error("Thiếu boardId");
        // Chi thanh vien nhom (bat ky vai tro) moi duoc upload.
        await requireBoardAccess(boardId, () => true);
        return {
          allowedContentTypes: VIDEO_CONTENT_TYPES,
          maximumSizeInBytes: MAX_VIDEO_BYTES,
          addRandomSuffix: true
        };
      },
      // DB duoc ghi o client (addBoardVideo) sau khi upload xong -> khong xu ly o day.
      onUploadCompleted: async () => {}
    });
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
