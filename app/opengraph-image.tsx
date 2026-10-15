import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { getSiteSettings } from "@/lib/siteSettings";
import { downloadMedia } from "@/lib/storage";

// 카카오톡/문자/페이스북 등으로 사이트 링크를 공유했을 때 함께 보이는
// 미리보기 이미지(오픈그래프 이미지)입니다. 관리자가 사이트 설정에서
// 로고/연합회 이름/슬로건을 바꾸면, 이 미리보기 이미지도 코드 수정 없이
// 자동으로 최신 내용을 반영합니다.
export const revalidate = 60;
export const alt = "담양마을학교 연합회";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// 폰트 파일은 매번 바뀌지 않는 고정 자산이므로 한 번만 읽어 재사용합니다.
const pretendardBoldPromise = readFile(join(process.cwd(), "assets/fonts/Pretendard-Bold.otf"));
const pretendardRegularPromise = readFile(join(process.cwd(), "assets/fonts/Pretendard-Regular.otf"));

export default async function Image() {
  const [settings, boldFont, regularFont] = await Promise.all([
    getSiteSettings(),
    pretendardBoldPromise,
    pretendardRegularPromise,
  ]);

  // 로고 이미지는 방문 때마다 바뀔 수 있는 값이라, 요청이 올 때마다 새로 가져와
  // 이미지 안에 직접 그려 넣습니다(외부 주소를 그대로 걸면 나중에 링크가
  // 만료되었을 때 미리보기 이미지까지 함께 깨질 수 있어, 여기서는 미리 그림으로 구워둡니다).
  // 원본이 webp 형식이면 미리보기 이미지 생성기가 읽지 못하므로 png로 바꿔줍니다.
  let logoSrc: string | null = null;
  if (settings.logo_image) {
    try {
      const buf = await downloadMedia(settings.logo_image);
      const pngBuf = await sharp(buf).png().toBuffer();
      logoSrc = `data:image/png;base64,${pngBuf.toString("base64")}`;
    } catch {
      logoSrc = null;
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#093624",
        }}
      >
        {logoSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoSrc}
            width={110}
            height={110}
            style={{ objectFit: "contain", marginBottom: 36 }}
          />
        )}
        <div
          style={{
            display: "flex",
            fontSize: 64,
            fontWeight: 700,
            color: "#ffffff",
            fontFamily: "Pretendard",
            textAlign: "center",
            padding: "0 60px",
          }}
        >
          {settings.association_name}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 22,
            fontSize: 30,
            fontWeight: 400,
            color: "rgba(255,255,255,0.82)",
            fontFamily: "Pretendard",
            textAlign: "center",
            padding: "0 90px",
          }}
        >
          {settings.association_slogan}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Pretendard", data: boldFont, weight: 700, style: "normal" },
        { name: "Pretendard", data: regularFont, weight: 400, style: "normal" },
      ],
    }
  );
}
