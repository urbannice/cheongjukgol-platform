import "server-only";
import { createAdminClient } from "@/lib/supabase/adminClient";

const BUCKET = "media";

export function buildStoragePath(params: {
  scope: "schools" | "activities" | "resources" | "settings";
  ownerId: string;
  kind: "hero" | "images" | "videos" | "documents";
  fileName: string;
}) {
  const safeName = params.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeName}`;
  if (params.scope === "schools") {
    return `schools/${params.ownerId}/${params.kind}/${unique}`;
  }
  if (params.scope === "resources") {
    return `resources/${unique}`;
  }
  if (params.scope === "settings") {
    return `settings/${params.ownerId}/${unique}`;
  }
  return `activities/${params.ownerId}/${params.kind}/${unique}`;
}

// 관리자가 파일을 올리기 전, "이 경로에 한 번만 업로드해도 좋다"는 서명된 허가를 발급합니다.
// 실제 파일 데이터는 이 서버를 거치지 않고 브라우저에서 Supabase Storage로 바로 전송되므로
// 영상처럼 큰 파일도 서버 요청 크기 제한 없이 안정적으로 올릴 수 있습니다.
export async function createSignedUploadUrl(path: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error) throw error;
  return data; // { signedUrl, token, path }
}

// 방문자/관리자에게 파일을 보여줄 때 쓰는 링크입니다.
// 페이지는 일정 시간(예: 60초) 동안 미리 만들어둔 화면을 그대로 보여주는데,
// 방문자가 뜸한 페이지는 몇 시간씩 다시 만들어지지 않을 수도 있습니다. 이 링크의
// 유효기간이 너무 짧으면(예전 1시간) 그사이에 링크가 만료되어 사진이 깨져 보이므로,
// 페이지가 한동안 안 열리더라도 사진이 멀쩡히 보이도록 유효기간을 넉넉히(7일) 둡니다.
export async function createSignedViewUrl(path: string, expiresInSeconds = 60 * 60 * 24 * 7) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}

export async function createSignedViewUrls(paths: string[], expiresInSeconds = 60 * 60 * 24 * 7) {
  if (paths.length === 0) return {};
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(paths, expiresInSeconds);
  if (error) throw error;
  const map: Record<string, string> = {};
  data.forEach((d, i) => {
    if (d.signedUrl) map[paths[i]] = d.signedUrl;
  });
  return map;
}

export async function deleteStorageObject(path: string) {
  const supabase = createAdminClient();
  await supabase.storage.from(BUCKET).remove([path]);
}

// 여러 파일을 한 번에 정리할 때 씁니다 (예: 활동/학교를 영구삭제할 때 관련 사진을 한 번에 정리).
// 실패해도 예외를 던지지 않습니다 — 파일 정리는 "안 되면 다음 기회에" 정도로 처리해서
// 삭제 자체(DB 정리)가 막히지 않도록 합니다.
export async function deleteStorageObjects(paths: (string | null | undefined)[]) {
  const list = Array.from(new Set(paths.filter((p): p is string => !!p)));
  if (list.length === 0) return;
  try {
    const supabase = createAdminClient();
    await supabase.storage.from(BUCKET).remove(list);
  } catch {
    // 파일 정리 실패는 조용히 무시합니다 (DB 삭제는 이미 별도로 진행됩니다).
  }
}

// 대표사진/Hero 이미지처럼 "한 곳에 파일 하나만" 저장하는 항목을 교체할 때 씁니다.
// 새 파일 경로를 DB에 먼저 반영(updateFn)한 뒤에만 이전 파일을 지워서,
// 만에 하나 저장이 실패해도 기존 이미지가 사라지지 않도록 순서를 지킵니다.
export async function replaceSingleFile(oldPath: string | null | undefined, newPath: string) {
  if (oldPath && oldPath !== newPath) {
    await deleteStorageObjects([oldPath]);
  }
}
