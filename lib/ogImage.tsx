import "server-only";
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { downloadMedia } from "@/lib/storage";

// 카카오톡/문자/페이스북 등으로 링크를 공유했을 때 보이는 미리보기 이미지(오픈그래프 이미지)를
// 홈·마을학교·활동 페이지가 같은 모양으로 만들 수 있도록 공통 부분을 모아둔 파일입니다.
export const OG_SIZE = { width: 1200, height: 630 };

// 폰트 파일은 매번 바뀌지 않는 고정 자산이므로 한 번만 읽어 재사용합니다.
const pretendardBoldPromise = readFile(join(process.cwd(), "assets/fonts/Pretendard-Bold.otf"));
const pretendardRegularPromise = readFile(join(process.cwd(), "assets/fonts/Pretendard-Regular.otf"));

// 보관함의 사진을 미리보기 카드 안에 직접 그려 넣습니다(외부 주소를 그대로 걸면 링크가
// 만료되었을 때 미리보기까지 깨질 수 있어 미리 그림으로 구워둡니다).
// webp 등은 미리보기 생성기가 바로 읽지 못해 png로 바꾸고, 카드 크기에 꽉 차게 잘라둡니다.
// 사진을 읽지 못하면 null을 돌려주고, 카드는 사진 없는 기본 모양으로 그려집니다.
export async function toBackgroundPng(path: string | null | undefined) {
  if (!path) return null;
  try {
    const buf = await downloadMedia(path);
    const png = await sharp(buf)
      .resize(OG_SIZE.width, OG_SIZE.height, { fit: "cover" })
      .png()
      .toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function toLogoPng(path: string | null | undefined) {
  if (!path) return null;
  try {
    const buf = await downloadMedia(path);
    const png = await sharp(buf).png().toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function renderShareCard({
  bgSrc,
  logoSrc,
  label,
  title,
  subtitle,
}: {
  bgSrc: string | null;
  logoSrc?: string | null;
  label?: string | null;
  title: string;
  subtitle?: string | null;
}) {
  const [boldFont, regularFont] = await Promise.all([pretendardBoldPromise, pretendardRegularPromise]);
  const options = {
    ...OG_SIZE,
    fonts: [
      { name: "Pretendard", data: boldFont, weight: 700 as const, style: "normal" as const },
      { name: "Pretendard", data: regularFont, weight: 400 as const, style: "normal" as const },
    ],
  };

  // 사진이 없으면: 짙은 초록 바탕 가운데에 로고·제목·설명을 놓는 기본 카드
  if (!bgSrc) {
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
            <img alt="" src={logoSrc} width={110} height={110} style={{ objectFit: "contain", marginBottom: 36 }} />
          )}
          {label && (
            <div
              style={{
                display: "flex",
                fontSize: 26,
                fontWeight: 400,
                color: "rgba(255,255,255,0.75)",
                fontFamily: "Pretendard",
                marginBottom: 16,
              }}
            >
              {label}
            </div>
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
            {title}
          </div>
          {subtitle && (
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
              {subtitle}
            </div>
          )}
        </div>
      ),
      options
    );
  }

  // 사진이 있으면: 사진을 꽉 채우고, 글자가 놓이는 아래쪽만 짙게 그라데이션을 줍니다.
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#093624" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          src={bgSrc}
          width={OG_SIZE.width}
          height={OG_SIZE.height}
          style={{ position: "absolute", top: 0, left: 0, objectFit: "cover" }}
        />
        <div
          style={{
            // 미리보기 생성기는 inset을 지원하지 않아 위치·크기를 직접 지정합니다.
            position: "absolute",
            top: 0,
            left: 0,
            width: OG_SIZE.width,
            height: OG_SIZE.height,
            backgroundImage:
              "linear-gradient(180deg, rgba(5,32,23,0.12) 0%, rgba(5,32,23,0.35) 55%, rgba(5,32,23,0.88) 100%)",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            width: "100%",
            height: "100%",
            padding: "72px",
          }}
        >
          {(logoSrc || label) && (
            <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
              {logoSrc && (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="" src={logoSrc} width={52} height={52} style={{ objectFit: "contain", marginRight: 16 }} />
              )}
              {label && (
                <div
                  style={{
                    display: "flex",
                    fontSize: 26,
                    fontWeight: 400,
                    color: "rgba(255,255,255,0.85)",
                    fontFamily: "Pretendard",
                  }}
                >
                  {label}
                </div>
              )}
            </div>
          )}
          <div
            style={{
              display: "flex",
              fontSize: 64,
              fontWeight: 700,
              color: "#ffffff",
              fontFamily: "Pretendard",
              lineHeight: 1.2,
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                display: "flex",
                marginTop: 18,
                fontSize: 28,
                fontWeight: 400,
                color: "rgba(255,255,255,0.88)",
                fontFamily: "Pretendard",
                maxWidth: 880,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
      </div>
    ),
    options
  );
}
