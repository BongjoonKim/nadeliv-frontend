import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { AnimatePresence, motion } from "framer-motion";
import {
  Image as ImageIcon,
  Plus,
  CloudUpload,
  ArrowRight,
} from "lucide-react";
import {
  useGetTravelMedia,
  useGetTravelMediaCount,
  useDeleteTravelMedia,
} from "../../../../../hooks/useTravelQueries";
import { TravelMedia } from "../../../../../types/travel/travelTypes";
import MediaGrid from "../../common/media/MediaGrid";
import MediaUploadZone from "../../common/media/MediaUploadZone";
import MediaLightbox from "../../common/media/MediaLightbox";
import { homeTokens } from "../../../MainPage/MainBody/homeTokens";

const t = homeTokens;

// 대시보드 미리보기 개수. 전체 보기·선택·일괄 관리는 앨범 전용 화면(/travel/album/:id)에서
const PREVIEW_COUNT = 12;

export interface TravelAlbumProps {
  travelId: string;
  /** 업로드·삭제 가능 여부 (ADMIN/USER). VIEWER 는 false */
  canEdit?: boolean;
}

/**
 * 대시보드 Album 섹션 — 최근 업로드 미리보기 스트립.
 * 드래그 드롭·빠른 업로드는 여기서도 되지만, 목록 전체는 앨범 화면으로 보낸다.
 */
function TravelAlbum({ travelId, canEdit = true }: TravelAlbumProps) {
  const navigate = useNavigate();
  const { data: media = [], isLoading } = useGetTravelMedia(travelId, 0, PREVIEW_COUNT);
  const { data: totalCount = 0 } = useGetTravelMediaCount(travelId);
  const deleteMutation = useDeleteTravelMedia();

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [lightboxMedia, setLightboxMedia] = useState<TravelMedia | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState<File[] | null>(null);
  const dragDepth = useRef(0);

  const albumPath = `/travel/album/${travelId}`;
  const remaining = Math.max(0, totalCount - media.length);

  // 섹션 전체 드래그 드롭 — 업로드 존이 닫혀 있어도 파일을 끌어오면 바로 업로드
  const hasFiles = (e: React.DragEvent) =>
    Array.from(e.dataTransfer.types).includes("Files");

  const handleSectionDragEnter = useCallback(
    (e: React.DragEvent) => {
      if (!canEdit || !hasFiles(e)) return;
      e.preventDefault();
      dragDepth.current += 1;
      setIsDragActive(true);
    },
    [canEdit]
  );

  const handleSectionDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!canEdit || !hasFiles(e)) return;
      e.preventDefault();
    },
    [canEdit]
  );

  const handleSectionDragLeave = useCallback(
    (e: React.DragEvent) => {
      if (!canEdit || !hasFiles(e)) return;
      e.preventDefault();
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) setIsDragActive(false);
    },
    [canEdit]
  );

  const handleSectionDrop = useCallback(
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

  const handleDroppedFilesConsumed = useCallback(() => {
    setDroppedFiles(null);
  }, []);

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
      }
    },
    [lightboxMedia, media]
  );

  const handleDelete = useCallback(
    async (mediaId: string) => {
      try {
        await deleteMutation.mutateAsync({ travelId, mediaId });
        if (lightboxMedia?.id === mediaId) setLightboxMedia(null);
      } catch (err) {
        console.error("Delete failed:", err);
      }
    },
    [travelId, deleteMutation, lightboxMedia]
  );

  return (
    <StyledTravelAlbum
      onDragEnter={handleSectionDragEnter}
      onDragOver={handleSectionDragOver}
      onDragLeave={handleSectionDragLeave}
      onDrop={handleSectionDrop}
    >
      <div className="dash-section">
        {isDragActive && (
          <div className="drop-overlay">
            <div className="drop-overlay-inner">
              <CloudUpload size={36} />
              <p>Drop photos or videos to upload</p>
            </div>
          </div>
        )}

        <div className="section-header">
          <h3 className="section-title">
            <ImageIcon size={16} />
            Album
            {totalCount > 0 && <span className="media-count">{totalCount}</span>}
          </h3>
          <div className="album-actions">
            <button className="action-btn view-all-btn" onClick={() => navigate(albumPath)}>
              <span>View all</span>
              <ArrowRight size={14} />
            </button>
            {canEdit && (
              <button
                className="section-action"
                title="Upload"
                onClick={() => setIsUploadOpen((prev) => !prev)}
              >
                <Plus size={16} />
              </button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {isUploadOpen && canEdit && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ overflow: "hidden" }}
            >
              <MediaUploadZone
                travelId={travelId}
                onUploadComplete={() => setIsUploadOpen(false)}
                externalFiles={droppedFiles}
                onExternalFilesConsumed={handleDroppedFilesConsumed}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="album-loading">
            <div className="loading-spinner" />
            <span>Loading photos...</span>
          </div>
        ) : media.length === 0 ? (
          <div className="empty-album">
            <ImageIcon size={32} />
            <p>No photos yet</p>
            <span>
              {canEdit
                ? "Drag & drop photos here, or tap + to upload"
                : "Nothing has been uploaded to this project yet"}
            </span>
          </div>
        ) : (
          <MediaGrid
            media={media}
            isSelectMode={false}
            selectedIds={EMPTY_SET}
            onSelect={() => {}}
            onMediaClick={handleMediaClick}
            cellSize="m"
            trailing={
              remaining > 0 ? (
                <button className="more-cell" onClick={() => navigate(albumPath)}>
                  <span className="more-count">+{remaining}</span>
                  <span className="more-label">more</span>
                </button>
              ) : undefined
            }
          />
        )}
      </div>

      <MediaLightbox
        isOpen={!!lightboxMedia}
        onClose={() => setLightboxMedia(null)}
        media={lightboxMedia}
        allMedia={media}
        travelId={travelId}
        onNavigate={handleLightboxNav}
        onDelete={handleDelete}
        canDelete={canEdit}
      />
    </StyledTravelAlbum>
  );
}

export default TravelAlbum;

const EMPTY_SET = new Set<string>();

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const StyledTravelAlbum = styled.div`
  .dash-section {
    position: relative;
    padding: 1.25rem 0;
    border-bottom: 1px solid ${t.color.border};
  }

  .drop-overlay {
    position: absolute;
    inset: 8px 0;
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px dashed ${t.color.accent};
    border-radius: 16px;
    background: rgba(18, 24, 22, 0.9);
    backdrop-filter: blur(2px);
  }

  .drop-overlay-inner {
    pointer-events: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: ${t.color.accent};

    p {
      font-size: 14px;
      font-weight: 600;
      color: ${t.color.text};
    }
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: ${t.color.text};
  }

  .media-count {
    font-size: 12px;
    font-weight: 600;
    color: ${t.color.accent};
    background: rgba(143, 191, 148, 0.12);
    padding: 1px 8px;
    border-radius: 10px;
  }

  .album-actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .action-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    border: 1px solid ${t.color.border};
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.05);
    color: ${t.color.accent};
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(143, 191, 148, 0.12);
    }
  }

  .section-action {
    padding: 6px;
    border: 1.5px dashed rgba(143, 191, 148, 0.35);
    border-radius: 10px;
    background: transparent;
    color: ${t.color.textMuted};
    cursor: pointer;
    transition: all 0.25s ease;

    &:hover {
      border-color: rgba(143, 191, 148, 0.5);
      color: ${t.color.accent};
      background: rgba(143, 191, 148, 0.12);
    }
  }

  /* 그리드 마지막 "+N more" 셀 */
  .more-cell {
    aspect-ratio: 1;
    border-radius: 12px;
    border: 1.5px dashed rgba(143, 191, 148, 0.35);
    background: ${t.color.surface};
    color: ${t.color.textSoft};
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    cursor: pointer;
    transition: all 0.2s ease;

    .more-count {
      font-size: 18px;
      font-weight: 600;
      color: ${t.color.accent};
    }

    .more-label {
      font-size: 12px;
      color: ${t.color.textMuted};
    }

    &:hover {
      border-color: rgba(143, 191, 148, 0.6);
      background: rgba(143, 191, 148, 0.08);
    }
  }

  .album-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 2rem 1rem;
    color: ${t.color.accent};
    font-size: 14px;
  }

  .loading-spinner {
    width: 28px;
    height: 28px;
    border: 3px solid rgba(143, 191, 148, 0.12);
    border-top-color: ${t.color.accent};
    border-radius: 50%;
    animation: ${spin} 0.7s linear infinite;
  }

  .empty-album {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 2.5rem 1rem;
    color: ${t.color.textMuted};
    text-align: center;

    p {
      font-size: 15px;
      font-weight: 500;
      color: ${t.color.textSoft};
    }

    span {
      font-size: 13px;
      color: ${t.color.textMuted};
    }
  }

  @media screen and (max-width: 600px) {
    .more-cell {
      border-radius: 8px;
    }
  }
`;
