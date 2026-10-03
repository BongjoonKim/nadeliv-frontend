import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useDeleteTravelMedia,
  useDownloadTravelMedia,
  useGetTravel,
  useGetTravelMediaCount,
  useGetTravelMediaInfinite,
} from "../../../../hooks/useTravelQueries";
import { useCurrentUser } from "../../../../hooks/useCurrentUser";
import {
  TravelMedia,
  TravelMediaSort,
  TravelMediaType,
} from "../../../../types/travel/travelTypes";
import { MediaCellSize } from "../common/media/MediaGrid/MediaGrid";

const CELL_SIZE_STORAGE_KEY = "nadeliv.travelAlbum.cellSize";

export const SORT_OPTIONS: { value: TravelMediaSort; label: string }[] = [
  { value: "created_desc", label: "Newest upload" },
  { value: "created_asc", label: "Oldest upload" },
  { value: "taken_desc", label: "Taken: newest" },
  { value: "taken_asc", label: "Taken: oldest" },
];

function readStoredCellSize(): MediaCellSize {
  try {
    const v = localStorage.getItem(CELL_SIZE_STORAGE_KEY);
    if (v === "s" || v === "m" || v === "l") return v;
  } catch {
    /* private mode 등 — 기본값 사용 */
  }
  return "m";
}

/**
 * 앨범 전용 화면 로직.
 * - 무한 스크롤(useInfiniteQuery) + 센티널 IntersectionObserver
 * - 필터(전체/사진/영상)·정렬·셀 크기
 * - 선택 모드(일괄 다운로드/삭제), 라이트박스, 페이지 전체 드래그 드롭 업로드
 */
export function useTravelAlbumPage() {
  const { travelId } = useParams<{ travelId: string }>();
  const navigate = useNavigate();

  const { data: travel, isLoading: isTravelLoading } = useGetTravel(travelId);
  const { data: currentUser } = useCurrentUser();

  const currentUserId = currentUser?.id;
  const isMember =
    travel?.members?.some((m) => m.userId === currentUserId) ?? false;
  const isViewer =
    travel?.members?.some(
      (m) => m.userId === currentUserId && m.role === "VIEWER"
    ) ?? false;
  const canEdit = isMember && !isViewer;

  // ---- 필터·정렬·표시
  const [type, setType] = useState<TravelMediaType>("all");
  const [sort, setSort] = useState<TravelMediaSort>("created_desc");
  const [cellSize, setCellSizeState] = useState<MediaCellSize>(readStoredCellSize);

  const setCellSize = useCallback((size: MediaCellSize) => {
    setCellSizeState(size);
    try {
      localStorage.setItem(CELL_SIZE_STORAGE_KEY, size);
    } catch {
      /* ignore */
    }
  }, []);

  // ---- 데이터
  const mediaQuery = useGetTravelMediaInfinite(travelId, { sort, type });
  const media = useMemo<TravelMedia[]>(
    () => mediaQuery.data?.pages.flat() ?? [],
    [mediaQuery.data]
  );

  const { data: totalCount = 0 } = useGetTravelMediaCount(travelId, "all");
  const { data: imageCount = 0 } = useGetTravelMediaCount(travelId, "image");
  const { data: videoCount = 0 } = useGetTravelMediaCount(travelId, "video");
  const currentCount =
    type === "image" ? imageCount : type === "video" ? videoCount : totalCount;

  // ---- 무한 스크롤 센티널
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = mediaQuery;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      // 뷰포트 아래 600px 전에 미리 로드
      { rootMargin: "0px 0px 600px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, media.length]);

  // ---- 선택 모드
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelectMode = useCallback(() => {
    setIsSelectMode((prev) => {
      if (prev) setSelectedIds(new Set());
      return !prev;
    });
  }, []);

  const exitSelectMode = useCallback(() => {
    setIsSelectMode(false);
    setSelectedIds(new Set());
  }, []);

  const handleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // 로드된 항목 기준 전체 선택/해제
  const allLoadedSelected = media.length > 0 && selectedIds.size === media.length;
  const handleSelectAllLoaded = useCallback(() => {
    if (allLoadedSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(media.map((m) => m.id)));
  }, [allLoadedSelected, media]);

  // 필터·정렬이 바뀌면 선택 초기화 (id 집합이 달라짐)
  useEffect(() => {
    setSelectedIds(new Set());
  }, [type, sort]);

  // ---- 라이트박스
  const [lightboxMedia, setLightboxMedia] = useState<TravelMedia | null>(null);

  const handleMediaClick = useCallback((item: TravelMedia) => {
    setLightboxMedia(item);
  }, []);

  const handleLightboxNav = useCallback(
    (direction: "prev" | "next") => {
      if (!lightboxMedia) return;
      const currentIndex = media.findIndex((m) => m.id === lightboxMedia.id);
      const nextIndex = direction === "prev" ? currentIndex - 1 : currentIndex + 1;
      if (nextIndex >= 0 && nextIndex < media.length) {
        setLightboxMedia(media[nextIndex]);
        // 끝에 가까워지면 다음 페이지 미리 로드
        if (direction === "next" && nextIndex >= media.length - 3 && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      }
    },
    [lightboxMedia, media, hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  // ---- 삭제·다운로드
  const deleteMutation = useDeleteTravelMedia();
  const { downloadSingle, downloadBatch } = useDownloadTravelMedia();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = useCallback(
    async (mediaId: string) => {
      if (!travelId) return;
      try {
        await deleteMutation.mutateAsync({ travelId, mediaId });
        if (lightboxMedia?.id === mediaId) {
          // 삭제한 항목 옆으로 이동, 없으면 닫기
          const idx = media.findIndex((m) => m.id === mediaId);
          const fallback = media[idx + 1] ?? media[idx - 1] ?? null;
          setLightboxMedia(fallback && fallback.id !== mediaId ? fallback : null);
        }
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(mediaId);
          return next;
        });
      } catch (err) {
        console.error("Delete failed:", err);
      }
    },
    [travelId, deleteMutation, lightboxMedia, media]
  );

  const handleBatchDownload = useCallback(async () => {
    if (!travelId || selectedIds.size === 0) return;
    setIsDownloading(true);
    try {
      const ids = Array.from(selectedIds);
      if (ids.length === 1) {
        const item = media.find((m) => m.id === ids[0]);
        if (item) await downloadSingle(travelId, item.id, item.originalFileName);
      } else {
        await downloadBatch(travelId, ids);
      }
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  }, [travelId, selectedIds, media, downloadSingle, downloadBatch]);

  const handleBatchDelete = useCallback(async () => {
    if (!travelId || selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const ok = window.confirm(
      `Delete ${ids.length} ${ids.length === 1 ? "item" : "items"}? This cannot be undone.`
    );
    if (!ok) return;
    setIsDeleting(true);
    try {
      for (const id of ids) {
        try {
          await deleteMutation.mutateAsync({ travelId, mediaId: id });
        } catch (err) {
          console.error(`Delete failed for ${id}:`, err);
        }
      }
    } finally {
      setIsDeleting(false);
      setSelectedIds(new Set());
    }
  }, [travelId, selectedIds, deleteMutation]);

  // ---- 업로드 (패널 + 페이지 전체 드래그 드롭)
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState<File[] | null>(null);
  const dragDepth = useRef(0);

  const hasFiles = (e: React.DragEvent) =>
    Array.from(e.dataTransfer.types).includes("Files");

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      if (!canEdit || !hasFiles(e)) return;
      e.preventDefault();
      dragDepth.current += 1;
      setIsDragActive(true);
    },
    [canEdit]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!canEdit || !hasFiles(e)) return;
      e.preventDefault();
    },
    [canEdit]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      if (!canEdit || !hasFiles(e)) return;
      e.preventDefault();
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) setIsDragActive(false);
    },
    [canEdit]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      if (!canEdit || !hasFiles(e)) return;
      e.preventDefault();
      dragDepth.current = 0;
      setIsDragActive(false);
      const files = Array.from(e.dataTransfer.files).filter(
        (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
      );
      if (files.length === 0) return;
      setDroppedFiles(files);
      setIsUploadOpen(true);
    },
    [canEdit]
  );

  const handleDroppedFilesConsumed = useCallback(() => setDroppedFiles(null), []);

  return {
    travelId,
    travel,
    isTravelLoading,
    canEdit,
    navigate,

    type,
    setType,
    sort,
    setSort,
    cellSize,
    setCellSize,

    media,
    isLoading: mediaQuery.isLoading,
    isError: mediaQuery.isError,
    hasNextPage,
    isFetchingNextPage,
    sentinelRef,
    totalCount,
    imageCount,
    videoCount,
    currentCount,

    isSelectMode,
    selectedIds,
    toggleSelectMode,
    exitSelectMode,
    handleSelect,
    handleSelectAllLoaded,
    allLoadedSelected,

    lightboxMedia,
    setLightboxMedia,
    handleMediaClick,
    handleLightboxNav,

    handleDelete,
    handleBatchDownload,
    handleBatchDelete,
    isDownloading,
    isDeleting,

    isUploadOpen,
    setIsUploadOpen,
    isDragActive,
    droppedFiles,
    handleDroppedFilesConsumed,
    dragHandlers: {
      onDragEnter: handleDragEnter,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
  };
}
