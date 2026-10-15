import { NextResponse } from "next/server";
import { createSignedViewUrl } from "@/lib/storage";
import { isPublicMediaPath } from "@/lib/publicMedia";

// 페이지에 들어 있는 "/media/보관경로" 주소로 사진을 열면, 그때마다 새 임시 주소를 만들어 연결합니다.
// 그래서 페이지가 아무리 오래 캐시되어 있어도 사진 주소가 만료되어 깨지는 일이 없습니다.
//
// 같은 사진을 매번 새로 서명하지 않도록 연결 결과를 잠시 저장(캐시)해 둡니다.
// 저장 시간(브라우저 5분 + Netlify 30분)이 임시 주소 유효시간(3시간)보다 훨씬 짧아서,
// 저장된 연결이 만료된 주소를 가리키는 일은 생기지 않습니다.
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 3;
const BROWSER_CACHE_SECONDS = 60 * 5;
const CDN_CACHE_SECONDS = 60 * 30;

export const dynamic = "force-dynamic";

function notFound() {
  return new NextResponse("Not found", {
    status: 404,
    headers: { "Cache-Control": "public, max-age=60" },
  });
}

export async function GET(_req: Request, ctx: RouteContext<"/media/[...path]">) {
  const { path: segments } = await ctx.params;
  // 보관 경로는 영문·숫자·._- 만 쓰므로 따로 디코딩할 필요가 없고, 그 밖의 글자는 아래 검사에서 거절됩니다.
  const path = segments.join("/");

  try {
    if (!(await isPublicMediaPath(path))) return notFound();
    const signedUrl = await createSignedViewUrl(path, SIGNED_URL_TTL_SECONDS);
    return NextResponse.redirect(signedUrl, {
      status: 302,
      headers: {
        "Cache-Control": `public, max-age=${BROWSER_CACHE_SECONDS}`,
        "Netlify-CDN-Cache-Control": `public, s-maxage=${CDN_CACHE_SECONDS}`,
      },
    });
  } catch {
    // 파일이 지워졌거나 일시적인 오류: 오류 응답은 캐시하지 않습니다.
    return new NextResponse("Media unavailable", {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
