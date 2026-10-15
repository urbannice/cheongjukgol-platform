import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { getSchoolBySlug } from "@/lib/publicData";
import { getSiteSettings } from "@/lib/siteSettings";
import { downloadMedia } from "@/lib/storage";

// 개별 마을학교 링크를 공유했을 때, 그 학교의 대표사진이 담긴 미리보기 이미지를
// 보여줍니다. 관리자가 그 학교의 대표이미지·소개글을 바꾸면 이 카드도
// 코드 수정 없이 자동으로 최신 내용을 반영합니다.
export const revalidate = 60;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const pretendardBoldPromise = readFile(join(process.cwd(), "assets/fonts/Pretendard-Bold.otf"));
const pretendardRegularPromise = readFile(join(process.cwd(), "assets/fonts/Pretendard-Regular.otf"));

// 사진(webp 등)은 미리보기 생성기가 바로 읽지 못할 수 있어 png로 바꾸고,
// 카드 크기(1200x630)에 꽉 차게 미리 잘라둡니다.
async function toBackgroundPng(path: string) {
  const buf = await downloadMedia(path);
  const png = await sharp(buf).resize(1200, 630, { fit: "cover" }).png().toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [school, settings, boldFont, regularFont] = await Promise.all([
    getSchoolBySlug(slug),
    getSiteSettings(),
    pretendardBoldPromise,
    pretendardRegularPromise,
  ]);

  const title = school?.name ?? settings.association_name;
  const subtitle = school?.short_description ?? settings.association_slogan;

  let bgSrc: string | null = null;
  if (school?.hero_image) {
    try {
      bgSrc = await toBackgroundPng(school.hero_image);
    } catch {
      bgSrc = null;
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#093624",
        }}
      >
        {bgSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bgSrc}
            width={1200}
            height={630}
            style={{ position: "absolute", top: 0, left: 0, objectFit: "cover" }}
          />
        )}
        {/* 사진은 최대한 그대로 보이게 하고, 글자가 놓이는 아래쪽만 짙게 그라데이션을 줍니다. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
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
          <div
            style={{
              display: "flex",
              fontSize: 26,
              fontWeight: 400,
              color: "rgba(255,255,255,0.85)",
              fontFamily: "Pretendard",
              marginBottom: 16,
            }}
          >
            {settings.association_name}
          </div>
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
    {
      ...size,
      fonts: [
        { name: "Pretendard", data: boldFont, weight: 700, style: "normal" },
        { name: "Pretendard", data: regularFont, weight: 400, style: "normal" },
      ],
    }
  );
}
