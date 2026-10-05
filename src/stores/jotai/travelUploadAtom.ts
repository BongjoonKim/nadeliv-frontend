import { atom } from "jotai";
import { MediaUploadMethod } from "../../types/travel/travelTypes";

// Travel 앨범 전역 업로드 큐.
// 페이지를 옮겨도 업로드가 이어지도록 컴포넌트가 아닌 전역에 둔다 (새로고침·탭 닫기는 막을 수 없음 → beforeunload 경고).

export type TravelUploadStatus = "pending" | "uploading" | "done" | "error" | "cancelled";

/** 서버 업로드 세션 — 실패 후 재시도 시 끝난 part 는 건너뛴다 */
export interface TravelUploadSession {
  uploadId: string;
  method: MediaUploadMethod;
  contentType: string;
  partSize: number;
  partCount: number;
  completedParts: number[];
}

export interface TravelUploadItem {
  id: string;
  travelId: string;
  file: File;
  status: TravelUploadStatus;
  /** 0~100 */
  progress: number;
  /** 이미지 미리보기 blob URL (영상·HEIC 은 null) */
  preview: string | null;
  errorMessage?: string;
  session?: TravelUploadSession;
}

export const travelUploadQueueAtom = atom<TravelUploadItem[]>([]);

/**
 * 화면에 떠 있는 MediaUploadZone 수.
 * 업로드 존이 큐 목록을 직접 보여주는 동안엔 떠 있는 트레이를 숨겨 중복 표시를 막는다.
 */
export const travelUploadZoneCountAtom = atom(0);
