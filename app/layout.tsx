import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getSiteSettings } from "@/lib/siteSettings";
import { resolveSiteBaseUrl } from "@/lib/siteUrl";

// 카카오톡/문자 등으로 링크를 공유했을 때 미리보기에 쓸 대표 이미지(og:image)는
// 같은 폴더의 opengraph-image.tsx 파일이 자동으로 만들어 붙여줍니다.
// 여기서는 미리보기 이미지의 절대주소를 만들 때 기준이 되는 사이트 주소(metadataBase)와
// 제목/설명을 정해줍니다. 사이트 주소는 관리자 설정에서 바꾸면 코드 수정 없이 바로 반영됩니다.
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const title = settings.association_name;
  const description =
    "담양 지역 마을학교의 활동과 사람, 프로그램을 연결하는 담양마을학교 연합회입니다.";
  return {
    metadataBase: new URL(resolveSiteBaseUrl(settings.site_base_url)),
    title,
    description,
    openGraph: {
      title,
      description,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css"
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
