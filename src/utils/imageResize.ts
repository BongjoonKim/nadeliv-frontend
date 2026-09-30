// 업로드 전 이미지를 브라우저에서 긴 변 기준으로 줄여 JPEG 로 다시 인코딩한다.
// 폰 원본 사진(수~수십 MB)을 목록의 작은 썸네일마다 그대로 내려받지 않도록 하기 위함.

// 브라우저가 디코딩하지 못하는 포맷(예: Chrome 의 HEIC)이면 표시도 못 하므로 에러로 알린다.
export class ImageDecodeError extends Error {
  constructor() {
    super("Unsupported image format");
    this.name = "ImageDecodeError";
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ImageDecodeError());
    };
    img.src = url;
  });
}

export async function resizeImageFile(
  file: File,
  maxEdge = 1600,
  quality = 0.85
): Promise<File> {
  // GIF 는 애니메이션이 사라지므로 그대로 둔다.
  if (file.type === "image/gif") return file;

  // <img> 는 EXIF 회전을 반영하고, drawImage 도 회전된 결과를 그린다.
  const img = await loadImage(file);
  const {naturalWidth: w, naturalHeight: h} = img;
  const scale = Math.min(1, maxEdge / Math.max(w, h));

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality)
  );
  // 이미 충분히 작은 원본이면 굳이 바꾸지 않는다.
  if (!blob || blob.size >= file.size) return file;

  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${baseName}.jpg`, {type: "image/jpeg"});
}
