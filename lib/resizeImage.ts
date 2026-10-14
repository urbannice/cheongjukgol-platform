// 스마트폰에서 찍은 큰 사진을 업로드 전에 브라우저에서 미리 줄여줍니다.
// 최대 가로/세로 1920px, WebP, 화질 80%로 변환해 서버 부담과 저장 용량을 줄입니다.
async function loadOrientedBitmap(file: File): Promise<ImageBitmap | null> {
  // imageOrientation: "from-image"를 주면 스마트폰 사진의 EXIF 회전 정보를 반영해서
  // 세로로 찍은 사진이 눕지 않고 화면에 보이는 그대로 저장됩니다.
  return createImageBitmap(file, { imageOrientation: "from-image" }).catch(() =>
    createImageBitmap(file).catch(() => null)
  );
}

function bitmapToWebpBlob(
  bitmap: ImageBitmap,
  maxDimension: number,
  quality: number
): Promise<Blob | null> {
  let { width, height } = bitmap;
  if (width > maxDimension || height > maxDimension) {
    const ratio = Math.min(maxDimension / width, maxDimension / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  ctx.drawImage(bitmap, 0, 0, width, height);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/webp", quality));
}

export async function resizeImageToWebp(file: File, maxDimension = 1920, quality = 0.8): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  const bitmap = await loadOrientedBitmap(file);
  if (!bitmap) return file;

  const blob = await bitmapToWebpBlob(bitmap, maxDimension, quality);
  if (!blob) return file;

  const newName = file.name.replace(/\.[^.]+$/, "") + ".webp";
  return new File([blob], newName, { type: "image/webp" });
}

// 목록/썸네일 화면에서 쓸 작은 사본을 함께 만듭니다 (긴 변 최대 480px).
// 원본 최적화본과 별도로 훨씬 가벼운 파일이라, 갤러리 목록을 훨씬 빠르게 불러올 수 있습니다.
export async function makeThumbnailWebp(file: File, maxDimension = 480, quality = 0.7): Promise<File | null> {
  if (!file.type.startsWith("image/")) return null;

  const bitmap = await loadOrientedBitmap(file);
  if (!bitmap) return null;

  const blob = await bitmapToWebpBlob(bitmap, maxDimension, quality);
  if (!blob) return null;

  const newName = file.name.replace(/\.[^.]+$/, "") + "_thumb.webp";
  return new File([blob], newName, { type: "image/webp" });
}
