import type { MediaType, MediaVisibility } from "@/lib/types";

// 자료 유형별 기본 공개범위: 사진/영상(외부 포함)/관련링크는 공개, 문서는 관리자 전용
export function defaultVisibilityFor(mediaType: MediaType): MediaVisibility {
  if (mediaType === "document") return "admin_only";
  return "public";
}
