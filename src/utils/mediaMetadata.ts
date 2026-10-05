// 업로드 전 파일에서 촬영 시각·크기·길이를 읽는다 (Travel 앨범 촬영일 정렬용).
// 실패해도 업로드는 계속돼야 하므로 모든 단계가 조용히 undefined 로 떨어진다.

import { MediaFileMetadata } from "../types/travel/travelTypes";

const METADATA_TIMEOUT_MS = 5000;

const pad = (n: number) => String(n).padStart(2, "0");

/** Date 의 로컬 벽시계 시각을 타임존 없는 "YYYY-MM-DDTHH:mm:ss" 로 (백엔드 LocalDateTime) */
const toLocalDateTimeString = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}:${pad(d.getSeconds())}`;

const isValidDate = (d: unknown): d is Date =>
  d instanceof Date && !Number.isNaN(d.getTime()) && d.getFullYear() > 1970;

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T | undefined> =>
  Promise.race([promise, new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), ms))]);

// ==================== 이미지 (EXIF) ====================

async function readImageMetadata(file: File): Promise<MediaFileMetadata> {
  // exifr 은 앨범 업로드 때만 필요하므로 별도 청크로 지연 로드
  const exifr = (await import("exifr")).default;
  const tags = await exifr.parse(file, {
    pick: [
      "DateTimeOriginal",
      "CreateDate",
      "ExifImageWidth",
      "ExifImageHeight",
      "ImageWidth",
      "ImageHeight",
      "Orientation",
    ],
    translateValues: false,
  });

  const meta: MediaFileMetadata = {};
  if (tags) {
    const taken = tags.DateTimeOriginal ?? tags.CreateDate;
    // EXIF 시각은 타임존이 없는 카메라 벽시계 시각 → exifr 이 로컬 Date 로 만들므로 로컬 성분 그대로 사용
    if (isValidDate(taken)) meta.takenAt = toLocalDateTimeString(taken);

    let w = tags.ExifImageWidth ?? tags.ImageWidth;
    let h = tags.ExifImageHeight ?? tags.ImageHeight;
    // Orientation 5~8 은 90° 회전 → 화면상 가로세로가 바뀜
    if (typeof tags.Orientation === "number" && tags.Orientation >= 5 && w && h) {
      [w, h] = [h, w];
    }
    if (w && h) {
      meta.width = w;
      meta.height = h;
    }
  }

  // EXIF 에 크기가 없으면(스크린샷·PNG 등) 브라우저 디코딩으로 측정. HEIC 은 Safari 외엔 실패 → 생략
  if (!meta.width) {
    const dims = await readImageDimensions(file);
    if (dims) Object.assign(meta, dims);
  }
  return meta;
}

function readImageDimensions(file: File): Promise<{ width: number; height: number } | undefined> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img.naturalWidth ? { width: img.naturalWidth, height: img.naturalHeight } : undefined);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(undefined);
    };
    img.src = url;
  });
}

// ==================== 영상 ====================

function readVideoElementMetadata(
  file: File
): Promise<{ width?: number; height?: number; duration?: number } | undefined> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    const done = (value?: { width?: number; height?: number; duration?: number }) => {
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
      video.load();
      resolve(value);
    };
    video.onloadedmetadata = () =>
      done({
        width: video.videoWidth || undefined,
        height: video.videoHeight || undefined,
        duration: Number.isFinite(video.duration) ? Math.round(video.duration) : undefined,
      });
    video.onerror = () => done(undefined);
    video.src = url;
  });
}

// QuickTime/MP4 epoch(1904-01-01) → Unix epoch 차이(초)
const MP4_EPOCH_OFFSET = 2082844800;
// moov 박스가 이보다 크면 촬영 시각 하나 읽자고 메모리에 올리지 않음
const MAX_MOOV_READ = 16 * 1024 * 1024;

async function readBytes(file: Blob, start: number, length: number): Promise<DataView> {
  const buf = await file.slice(start, start + length).arrayBuffer();
  return new DataView(buf);
}

/**
 * MP4/MOV 의 moov > mvhd creation_time (UTC) 를 읽는다.
 * 최상위 박스 헤더만 건너뛰며 찾으므로 5GB 파일도 몇 KB 만 읽는다.
 */
async function readMp4CreationTime(file: File): Promise<Date | undefined> {
  let offset = 0;
  while (offset + 8 <= file.size) {
    const header = await readBytes(file, offset, 16);
    let size = header.getUint32(0);
    const type = String.fromCharCode(
      header.getUint8(4),
      header.getUint8(5),
      header.getUint8(6),
      header.getUint8(7)
    );
    let headerSize = 8;
    if (size === 1) {
      // 64bit largesize
      if (header.byteLength < 16) return undefined;
      size = header.getUint32(8) * 2 ** 32 + header.getUint32(12);
      headerSize = 16;
    } else if (size === 0) {
      size = file.size - offset;
    }
    if (size < headerSize) return undefined;

    if (type === "moov") {
      if (size > MAX_MOOV_READ) return undefined;
      const moov = await readBytes(file, offset + headerSize, size - headerSize);
      return findMvhdCreationTime(moov);
    }
    offset += size;
  }
  return undefined;
}

function findMvhdCreationTime(moov: DataView): Date | undefined {
  let p = 0;
  while (p + 8 <= moov.byteLength) {
    const size = moov.getUint32(p);
    const type = String.fromCharCode(
      moov.getUint8(p + 4),
      moov.getUint8(p + 5),
      moov.getUint8(p + 6),
      moov.getUint8(p + 7)
    );
    if (size < 8) return undefined;
    if (type === "mvhd" && p + 20 <= moov.byteLength) {
      const version = moov.getUint8(p + 8);
      const seconds =
        version === 1 && p + 20 <= moov.byteLength
          ? moov.getUint32(p + 12) * 2 ** 32 + moov.getUint32(p + 16)
          : moov.getUint32(p + 12);
      if (!seconds) return undefined;
      const date = new Date((seconds - MP4_EPOCH_OFFSET) * 1000);
      return isValidDate(date) ? date : undefined;
    }
    p += size;
  }
  return undefined;
}

async function readVideoMetadata(file: File): Promise<MediaFileMetadata> {
  const [elementMeta, created] = await Promise.all([
    readVideoElementMetadata(file).catch(() => undefined),
    readMp4CreationTime(file).catch(() => undefined),
  ]);
  return {
    ...(elementMeta ?? {}),
    // mvhd 는 UTC → 업로드하는 사람의 로컬 시각으로 변환 (여행지 시차는 감안 못 함)
    takenAt: created ? toLocalDateTimeString(created) : undefined,
  };
}

// ==================== entry ====================

/** contentType 은 file.type 이 비어 있을 때 확장자로 보정한 값 */
export async function extractMediaMetadata(
  file: File,
  contentType: string = file.type
): Promise<MediaFileMetadata> {
  try {
    const task = contentType.startsWith("video/")
      ? readVideoMetadata(file)
      : contentType.startsWith("image/")
      ? readImageMetadata(file)
      : Promise.resolve({});
    return (await withTimeout(task, METADATA_TIMEOUT_MS)) ?? {};
  } catch {
    return {};
  }
}
