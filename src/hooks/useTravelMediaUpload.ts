// Travel 미디어 presigned 직접 업로드 (브라우저 → S3, EC2 미경유).
// 흐름: init(URL 발급) → part 별 PUT → complete(서버가 S3 확인 후 TravelMedia 등록)
// 큐 상태는 전역 Jotai(travelUploadAtom), 실제 처리 루프는 앱 루트의 TravelUploadTray 가 한 번만 돌린다.

import { useCallback, useEffect, useRef } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useQueryClient } from "@tanstack/react-query";
import useAuthEP from "../utils/useAuthEP";
import {
  abortTravelMediaUpload,
  completeTravelMediaUpload,
  initTravelMediaUpload,
  putToPresignedUrl,
  refreshTravelMediaUploadParts,
} from "../endpoints/travel-endpoints";
import {
  MediaUploadInitResponse,
  MediaUploadPart,
  TravelMedia,
} from "../types/travel/travelTypes";
import {
  TravelUploadItem,
  TravelUploadSession,
  travelUploadQueueAtom,
} from "../stores/jotai/travelUploadAtom";
import { extractMediaMetadata } from "../utils/mediaMetadata";

/** 동시에 올리는 파일 수 */
const MAX_CONCURRENT_FILES = 2;
/** 멀티파트 한 파일 안에서 동시에 올리는 part 수 (파일 2 × part 3 = 브라우저 호스트당 연결 6개 이내) */
const PART_CONCURRENCY = 3;
const PART_MAX_RETRIES = 3;
export const MAX_UPLOAD_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB — 백엔드와 동일

// 브라우저가 type 을 비우거나 octet-stream 으로 주는 경우(Windows 의 HEIC 등) 확장자로 보정
const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  mp4: "video/mp4",
  m4v: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
};

export const resolveMediaContentType = (file: File): string => {
  if (file.type && file.type !== "application/octet-stream") return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXT[ext] ?? "";
};

export const isUploadableMedia = (file: File) => {
  const type = resolveMediaContentType(file);
  return type.startsWith("image/") || type.startsWith("video/");
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const errorStatus = (err: any): number | undefined => err?.response?.status;

export const uploadErrorMessage = (err: any): string =>
  err?.response?.data?.message ||
  err?.response?.data?.error ||
  (err?.message === "AUTHENTICATION_FAILED" ? "Please sign in again" : err?.message) ||
  "Upload failed";

// ==================== 파일 1개 업로드 ====================

interface UploadCallbacks {
  signal: AbortSignal;
  onProgress: (percent: number) => void;
  onSession: (session: TravelUploadSession) => void;
}

/** 큐 아이템 1개를 끝까지 올린다. session 이 있으면 끝난 part 를 건너뛰고 이어서 올림 */
export const useTravelMediaUploader = () => {
  const authEP = useAuthEP();

  return useCallback(
    async (item: TravelUploadItem, cb: UploadCallbacks): Promise<TravelMedia> => {
      const { file, travelId } = item;
      let session = item.session;
      let urls = new Map<number, MediaUploadPart>();

      const applyUrls = (res: MediaUploadInitResponse) => {
        res.parts.forEach((p) => urls.set(p.partNumber, p));
      };

      const refreshUrls = async (partNumbers: number[]) => {
        const res = await authEP({
          func: refreshTravelMediaUploadParts,
          params: { travelId, uploadId: session!.uploadId, partNumbers },
        });
        applyUrls(res.data);
      };

      // 1) 세션 확보 — 재시도면 남은 part URL 만 재발급, 세션이 만료(404)됐으면 처음부터
      if (session) {
        const missing = range(session.partCount).filter((n) => !session!.completedParts.includes(n));
        try {
          if (missing.length > 0) await refreshUrls(missing);
        } catch (err) {
          if (errorStatus(err) !== 404) throw err;
          session = undefined;
          urls = new Map();
        }
      }
      if (!session) {
        const contentType = resolveMediaContentType(file);
        const meta = await extractMediaMetadata(file, contentType);
        const res = await authEP({
          func: initTravelMediaUpload,
          params: { travelId },
          reqBody: {
            fileName: file.name,
            contentType,
            fileSize: file.size,
            ...meta,
          },
        });
        const init: MediaUploadInitResponse = res.data;
        session = {
          uploadId: init.uploadId,
          method: init.method,
          contentType: init.contentType,
          partSize: init.partSize,
          partCount: init.partCount,
          completedParts: [],
        };
        applyUrls(init);
        cb.onSession(session);
        // init 응답 전에 취소됐으면 방금 만든 서버 세션을 바로 정리
        if (cb.signal.aborted) {
          authEP({
            func: abortTravelMediaUpload,
            params: { travelId, uploadId: init.uploadId },
          }).catch(() => undefined);
          throw new DOMException("Aborted", "AbortError");
        }
      }
      const s = session;

      // 2) part 업로드 — 진행률은 끝난 part 바이트 + 진행 중 part 바이트
      const partBytes = (n: number) => Math.min(s.partSize, file.size - (n - 1) * s.partSize);
      const completed = new Set(s.completedParts);
      let completedBytes = Array.from(completed).reduce((acc, n) => acc + partBytes(n), 0);
      const inflight = new Map<number, number>();
      let lastPercent = -1;
      const report = () => {
        let loaded = completedBytes;
        inflight.forEach((v) => (loaded += v));
        // complete 전까지는 99% 에서 멈춤
        const percent = Math.min(99, Math.floor((loaded / file.size) * 100));
        if (percent !== lastPercent) {
          lastPercent = percent;
          cb.onProgress(percent);
        }
      };
      report();

      const queue = range(s.partCount).filter((n) => !completed.has(n));
      const uploadPart = async (n: number) => {
        for (let attempt = 0; ; attempt++) {
          const part = urls.get(n);
          if (!part) await refreshUrls([n]);
          const target = urls.get(n)!;
          const start = (n - 1) * s.partSize;
          try {
            await putToPresignedUrl({
              url: target.url,
              body: file.slice(start, start + target.size),
              // 단일 PUT 은 Content-Type 이 서명에 포함됨
              contentType: s.method === "SINGLE" ? s.contentType : undefined,
              onProgress: (loaded) => {
                inflight.set(n, loaded);
                report();
              },
              signal: cb.signal,
            });
            inflight.delete(n);
            completed.add(n);
            completedBytes += target.size;
            s.completedParts = Array.from(completed);
            cb.onSession({ ...s });
            report();
            return;
          } catch (err) {
            inflight.delete(n);
            if (cb.signal.aborted) throw err;
            if (attempt >= PART_MAX_RETRIES) throw err;
            // presigned URL 만료(403) → 재발급, 그 외(네트워크 끊김 등)는 백오프 후 재시도
            if (errorStatus(err) === 403) {
              urls.delete(n);
            } else {
              await sleep(1000 * 2 ** attempt);
            }
          }
        }
      };

      // 한 part 가 최종 실패하면 다른 worker 도 새 part 를 집지 않게 멈춘다
      let failed = false;
      const workers = Array.from(
        { length: s.method === "MULTIPART" ? PART_CONCURRENCY : 1 },
        async () => {
          while (queue.length > 0 && !failed) {
            if (cb.signal.aborted) throw new DOMException("Aborted", "AbortError");
            try {
              await uploadPart(queue.shift()!);
            } catch (err) {
              failed = true;
              throw err;
            }
          }
        }
      );
      await Promise.all(workers);

      // 3) 완료 — 서버가 S3 크기 확인 후 TravelMedia 등록. 재호출해도 같은 미디어가 돌아옴
      try {
        const res = await authEP({
          func: completeTravelMediaUpload,
          params: { travelId, uploadId: s.uploadId },
        });
        return res.data as TravelMedia;
      } catch (err) {
        // 서버 기준 part 가 모자라면(409) 재시도 때 전부 다시 올리도록 기록을 비운다
        if (errorStatus(err) === 409) {
          cb.onSession({ ...s, completedParts: [] });
        }
        throw err;
      }
    },
    [authEP]
  );
};

const range = (count: number) => Array.from({ length: count }, (_, i) => i + 1);

// ==================== 큐 조작 ====================

// AbortController 는 직렬화할 필요 없는 런타임 핸들이라 atom 밖에 둔다
const controllers = new Map<string, AbortController>();

const newId = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;

const canPreview = (type: string) =>
  type.startsWith("image/") && type !== "image/heic" && type !== "image/heif";

export const useTravelUploadQueue = () => {
  const [queue, setQueue] = useAtom(travelUploadQueueAtom);
  const authEP = useAuthEP();

  /** 업로드 가능한 파일만 큐에 추가. 건너뛴 사유별 개수를 돌려준다 */
  const enqueue = useCallback(
    (travelId: string, files: File[]) => {
      const media = files.filter(isUploadableMedia);
      const tooLarge = media.filter((f) => f.size > MAX_UPLOAD_FILE_SIZE);
      const accepted = media.filter((f) => f.size <= MAX_UPLOAD_FILE_SIZE);
      let duplicates = 0;
      setQueue((prev) => {
        // 같은 프로젝트에 같은 이름·크기 파일이 이미 대기·진행 중이면 중복으로 보고 건너뜀
        const existing = new Set(
          prev
            .filter((i) => i.travelId === travelId && i.status !== "cancelled")
            .map((i) => `${i.file.name}:${i.file.size}`)
        );
        const items: TravelUploadItem[] = [];
        accepted.forEach((file) => {
          const key = `${file.name}:${file.size}`;
          if (existing.has(key)) {
            duplicates++;
            return;
          }
          existing.add(key);
          const type = resolveMediaContentType(file);
          items.push({
            id: newId(),
            travelId,
            file,
            status: "pending",
            progress: 0,
            preview: canPreview(type) ? URL.createObjectURL(file) : null,
          });
        });
        return [...prev, ...items];
      });
      return {
        unsupported: files.length - media.length,
        tooLarge: tooLarge.length,
        duplicates,
      };
    },
    [setQueue]
  );

  const patch = useCallback(
    (id: string, p: Partial<TravelUploadItem>) =>
      setQueue((prev) => prev.map((i) => (i.id === id ? { ...i, ...p } : i))),
    [setQueue]
  );

  const abortSession = useCallback(
    (item: TravelUploadItem) => {
      if (!item.session) return;
      // 서버 세션·S3 조각 정리 (실패해도 만료 스케줄러가 치운다)
      authEP({
        func: abortTravelMediaUpload,
        params: { travelId: item.travelId, uploadId: item.session.uploadId },
      }).catch(() => undefined);
    },
    [authEP]
  );

  const cancel = useCallback(
    (id: string) => {
      const item = queue.find((i) => i.id === id);
      if (!item) return;
      controllers.get(id)?.abort();
      controllers.delete(id);
      abortSession(item);
      patch(id, { status: "cancelled", session: undefined });
    },
    [queue, patch, abortSession]
  );

  const retry = useCallback(
    (id: string) => patch(id, { status: "pending", errorMessage: undefined }),
    [patch]
  );

  const remove = useCallback(
    (id: string) => {
      const item = queue.find((i) => i.id === id);
      if (!item) return;
      if (item.status === "uploading") return;
      // 실패한 채로 지우는 경우 서버 세션도 정리
      if (item.status === "error") abortSession(item);
      if (item.preview) URL.revokeObjectURL(item.preview);
      setQueue((prev) => prev.filter((i) => i.id !== id));
    },
    [queue, setQueue, abortSession]
  );

  /** 끝난(완료·취소) 항목 정리. travelId 를 주면 그 프로젝트 것만 */
  const clearFinished = useCallback(
    (travelId?: string) =>
      setQueue((prev) => {
        const isFinished = (i: TravelUploadItem) =>
          (i.status === "done" || i.status === "cancelled") &&
          (!travelId || i.travelId === travelId);
        prev.filter(isFinished).forEach((i) => i.preview && URL.revokeObjectURL(i.preview));
        return prev.filter((i) => !isFinished(i));
      }),
    [setQueue]
  );

  return { queue, enqueue, cancel, retry, remove, clearFinished };
};

// ==================== 처리 루프 (앱에서 한 번만 마운트) ====================

export const useTravelUploadEngine = () => {
  const queue = useAtomValue(travelUploadQueueAtom);
  const setQueue = useSetAtom(travelUploadQueueAtom);
  const uploadFile = useTravelMediaUploader();
  const queryClient = useQueryClient();
  // uploader 는 토큰 변경 시 바뀌므로 ref 로 최신값만 참조 (effect 재실행 방지)
  const uploadRef = useRef(uploadFile);
  uploadRef.current = uploadFile;

  // 파일마다 앨범 목록을 다시 받지 않도록 프로젝트별로 모아서 무효화
  const invalidateTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const scheduleInvalidate = useCallback(
    (travelId: string) => {
      const timers = invalidateTimers.current;
      const prev = timers.get(travelId);
      if (prev) clearTimeout(prev);
      timers.set(
        travelId,
        setTimeout(() => {
          timers.delete(travelId);
          queryClient.invalidateQueries({ queryKey: ["travelMedia", travelId] });
          queryClient.invalidateQueries({ queryKey: ["travelMediaCount", travelId] });
        }, 1500)
      );
    },
    [queryClient]
  );

  const patch = useCallback(
    (id: string, p: Partial<TravelUploadItem>) =>
      setQueue((prev) => prev.map((i) => (i.id === id ? { ...i, ...p } : i))),
    [setQueue]
  );

  useEffect(() => {
    const uploadingCount = queue.filter((i) => i.status === "uploading").length;
    if (uploadingCount >= MAX_CONCURRENT_FILES) return;
    const next = queue.find((i) => i.status === "pending");
    if (!next) return;

    const controller = new AbortController();
    controllers.set(next.id, controller);
    patch(next.id, { status: "uploading" });

    uploadRef
      .current(next, {
        signal: controller.signal,
        onProgress: (progress) => patch(next.id, { progress }),
        onSession: (session) => patch(next.id, { session }),
      })
      .then(() => {
        patch(next.id, { status: "done", progress: 100, session: undefined });
        scheduleInvalidate(next.travelId);
      })
      .catch((err) => {
        // 취소는 cancel() 이 이미 상태를 바꿨음
        if (controller.signal.aborted) return;
        patch(next.id, { status: "error", errorMessage: uploadErrorMessage(err) });
      })
      .finally(() => controllers.delete(next.id));
  }, [queue, patch, scheduleInvalidate]);

  // 업로드 중 탭 닫기·새로고침 경고 (웹은 페이지를 떠나면 업로드가 끊김)
  const isActive = queue.some((i) => i.status === "uploading" || i.status === "pending");
  useEffect(() => {
    if (!isActive) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isActive]);
};
