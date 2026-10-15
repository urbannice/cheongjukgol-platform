import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { buildStoragePath, createSignedUploadUrl } from "@/lib/storage";
import {
  ALL_DOCUMENT_EXTENSIONS,
  DOCUMENT_EXTENSIONS,
  FILE_SIZE_LIMITS,
  PRESENTATION_EXTENSIONS,
} from "@/lib/types";

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await req.json();
  const { scope, ownerId, kind, fileName, fileSize, fileKind } = body as {
    scope: "schools" | "activities" | "settings";
    ownerId: string;
    kind: "hero" | "images" | "videos" | "documents";
    fileName: string;
    fileSize: number;
    fileKind: "image" | "video" | "document" | "presentation";
  };

  if (!scope || !ownerId || !kind || !fileName || typeof fileSize !== "number") {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";

  if (fileKind === "document") {
    const allowed = DOCUMENT_EXTENSIONS.includes(ext) || PRESENTATION_EXTENSIONS.includes(ext);
    if (!allowed || !ALL_DOCUMENT_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: "허용되지 않는 파일 형식입니다. (PDF, HWP, Word, PPT, Excel만 가능)" },
        { status: 400 }
      );
    }
    const limit = PRESENTATION_EXTENSIONS.includes(ext)
      ? FILE_SIZE_LIMITS.presentation
      : FILE_SIZE_LIMITS.document;
    if (fileSize > limit) {
      return NextResponse.json(
        {
          error: `파일 용량이 큽니다. (최대 ${Math.round(
            limit / 1024 / 1024
          )}MB) 압축 후 다시 등록해주세요.`,
        },
        { status: 400 }
      );
    }
  } else if (fileKind === "image") {
    if (fileSize > FILE_SIZE_LIMITS.image) {
      return NextResponse.json(
        { error: `사진 용량이 너무 큽니다. (최대 ${Math.round(FILE_SIZE_LIMITS.image / 1024 / 1024)}MB)` },
        { status: 400 }
      );
    }
  } else if (fileKind === "video") {
    if (fileSize > FILE_SIZE_LIMITS.video) {
      return NextResponse.json(
        {
          error:
            "영상 용량이 200MB를 넘습니다. 이런 경우 유튜브에 업로드한 뒤 링크로 등록하는 것을 권장합니다.",
        },
        { status: 400 }
      );
    }
  }

  const path = buildStoragePath({ scope, ownerId, kind, fileName });
  const signed = await createSignedUploadUrl(path);

  return NextResponse.json(signed);
}
