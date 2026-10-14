const ROMANIZATION: Record<string, string> = {
  ㄱ: "g", ㄲ: "kk", ㄴ: "n", ㄷ: "d", ㄸ: "tt", ㄹ: "r", ㅁ: "m", ㅂ: "b",
  ㅃ: "pp", ㅅ: "s", ㅆ: "ss", ㅇ: "", ㅈ: "j", ㅉ: "jj", ㅊ: "ch", ㅋ: "k",
  ㅌ: "t", ㅍ: "p", ㅎ: "h",
};

// 한글 학교명을 기본 slug 후보로 변환합니다 (완벽한 로마자 표기가 아니라, 관리자가
// 손쉽게 다듬어 쓸 수 있는 "시작점"을 제공하는 용도입니다. 관리자가 직접 수정 가능합니다).
export function suggestSlug(input: string): string {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-");
  const ascii = base.replace(/[가-힣]/g, "");
  if (ascii.replace(/-/g, "").length >= 2) {
    return ascii.replace(/^-+|-+$/g, "") || `school-${Date.now()}`;
  }
  return `school-${Math.random().toString(36).slice(2, 8)}`;
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/.test(slug);
}
