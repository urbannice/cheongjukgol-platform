import { createBrowserClient } from "@/lib/supabase/browserClient";
import { makeThumbnailWebp, resizeImageToWebp } from "@/lib/resizeImage";

async function uploadOne(file: File, scope: "schools" | "activities" | "settings", ownerId: string, kind: "hero" | "images" | "videos" | "documents") {
  const res = await fetch("/api/admin/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      scope,
      ownerId,
      kind,
      fileName: file.name,
      fileSize: file.size,
      fileKind: file.type.startsWith("image/") ? "image" : "document",
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "업로드 준비 중 오류가 발생했습니다.");
  }

  const { token, path } = await res.json();

  const supabase = createBrowserClient();
  const { error } = await supabase.storage.from("media").uploadToSignedUrl(path, token, file, {
    contentType: file.type || "application/octet-stream",
  });
  if (error) throw new Error(`업로드 중 오류가 발생했습니다: ${error.message}`);
  return path as string;
}

export async function uploadFileDirect(params: {
  file: File;
  scope: "schools" | "activities" | "settings";
  ownerId: string;
  kind: "hero" | "images" | "videos" | "documents";
  fileKind: "image" | "video" | "document" | "presentation";
  // true로 주면 목록/썸네일용 작은 사본도 함께 만들어 업로드하고 경로를 같이 돌려줍니다.
  // (갤러리 사진처럼 여러 장이 쌓여서 목록에 자주 노출되는 경우에만 사용)
  generateThumbnail?: boolean;
}) {
  let file = params.file;
  let thumbFile: File | null = null;
  if (params.fileKind === "image") {
    if (params.generateThumbnail) {
      thumbFile = await makeThumbnailWebp(file);
    }
    file = await resizeImageToWebp(file);
  }

  const res = await fetch("/api/admin/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      scope: params.scope,
      ownerId: params.ownerId,
      kind: params.kind,
      fileName: file.name,
      fileSize: file.size,
      fileKind: params.fileKind,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "업로드 준비 중 오류가 발생했습니다.");
  }

  const { token, path } = await res.json();

  const supabase = createBrowserClient();
  const { error } = await supabase.storage.from("media").uploadToSignedUrl(path, token, file, {
    contentType: file.type || "application/octet-stream",
  });
  if (error) throw new Error(`업로드 중 오류가 발생했습니다: ${error.message}`);

  // 썸네일은 "있으면 좋은" 부가 파일이라, 실패해도 원본 업로드 자체는 그대로 성공 처리합니다.
  let thumbPath: string | null = null;
  if (thumbFile) {
    try {
      thumbPath = await uploadOne(thumbFile, params.scope, params.ownerId, params.kind);
    } catch {
      thumbPath = null;
    }
  }

  // 참고: 업로드 응답의 signedUrl은 "업로드용" 링크라 화면에 바로 보여줄 수 없습니다.
  // 그래서 방금 올린 파일 그대로 브라우저 안에서 미리보기 링크를 만들어 돌려줍니다.
  const previewUrl = URL.createObjectURL(file);

  return {
    path,
    thumbPath,
    size: file.size,
    mimeType: file.type,
    originalFileName: params.file.name,
    previewUrl,
  };
}
