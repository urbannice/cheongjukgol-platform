// 방문자 화면에 넣는 사진 주소를 만듭니다.
// 예전에는 Supabase의 임시 주소(유효기간 7일)를 페이지에 그대로 넣어서, 한동안 아무도 열지 않은
// 페이지는 주소가 만료되어 사진이 깨질 수 있었습니다. 이제는 "/media/보관경로" 형태의 우리 사이트
// 고정 주소를 넣고, 사진을 열 때마다 서버(app/media/[...path]/route.ts)가 새 임시 주소로 연결합니다.
// 페이지가 아무리 오래 캐시되어 있어도 이 주소는 만료되지 않습니다.
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return "/media/" + path.split("/").map(encodeURIComponent).join("/");
}

// 여러 경로를 한 번에 바꿀 때 씁니다. { 보관경로: "/media/..." } 형태로 돌려줍니다.
export function mediaUrlMap(paths: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const p of paths) {
    const url = mediaUrl(p);
    if (url) map[p] = url;
  }
  return map;
}
