import { useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Trash2,
  X,
} from "lucide-react";
import { TravelMedia } from "../../../../../../types/travel/travelTypes";
import { useDownloadTravelMedia } from "../../../../../../hooks/useTravelQueries";

export interface MediaLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  media: TravelMedia | null;
  allMedia: TravelMedia[];
  travelId: string;
  onNavigate: (direction: "prev" | "next") => void;
  onDelete: (mediaId: string) => void;
  /** 삭제 버튼 노출 여부 (VIEWER 등 편집 불가 멤버는 숨김). 기본 true */
  canDelete?: boolean;
}

function MediaLightbox({
  isOpen,
  onClose,
  media,
  allMedia,
  travelId,
  onNavigate,
  onDelete,
  canDelete = true,
}: MediaLightboxProps) {
  const { downloadSingle } = useDownloadTravelMedia();
  const [isDownloading, setIsDownloading] = useState(false);

  const currentIndex = media
    ? allMedia.findIndex((m) => m.id === media.id)
    : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allMedia.length - 1;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "ArrowLeft" && hasPrev) onNavigate("prev");
      if (e.key === "ArrowRight" && hasNext) onNavigate("next");
      if (e.key === "Escape") onClose();
    },
    [isOpen, hasPrev, hasNext, onNavigate, onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // 모달 열릴 때 body 스크롤 잠금
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [isOpen]);

  const handleDownload = async () => {
    if (!media) return;
    setIsDownloading(true);
    try {
      await downloadSingle(travelId, media.id, media.originalFileName);
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = () => {
    if (!media) return;
    onDelete(media.id);
  };

  const isVideo = media?.mimeType?.startsWith("video/");

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isOpen || !media) return null;

  return createPortal(
    <StyledLightboxOverlay onClick={onClose}>
      <StyledMediaLightbox onClick={(e) => e.stopPropagation()}>
        {/* Top bar */}
        <div className="lightbox-topbar">
          <button className="lightbox-btn close-btn" onClick={onClose}>
            <X size={20} />
          </button>
          <div className="topbar-actions">
            <button
              className="lightbox-btn"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              <Download size={18} />
            </button>
            {canDelete && (
              <button className="lightbox-btn delete-btn" onClick={handleDelete}>
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Media viewer */}
        <div className="lightbox-viewer">
          {hasPrev && (
            <button
              className="nav-btn nav-prev"
              onClick={() => onNavigate("prev")}
            >
              <ChevronLeft size={28} />
            </button>
          )}

          <div className="media-container">
            {isVideo ? (
              <video
                key={media.id}
                controls
                autoPlay={false}
                // 원본 전체를 미리 받지 않도록 메타데이터만 로드, 첫 화면은 썸네일로
                preload="metadata"
                poster={media.thumbnailUrl || undefined}
                className="lightbox-video"
              >
                <source src={media.fileUrl} type={media.mimeType} />
              </video>
            ) : (
              <img
                key={media.id}
                src={media.fileUrl}
                alt={media.originalFileName}
                className="lightbox-image"
                // HEIC 원본은 Safari 외 브라우저가 못 그림 → Lambda 가 만든 JPEG 썸네일로 대체
                onError={(e) => {
                  const img = e.currentTarget;
                  if (media.thumbnailUrl && img.src !== media.thumbnailUrl) {
                    img.src = media.thumbnailUrl;
                  }
                }}
              />
            )}
          </div>

          {hasNext && (
            <button
              className="nav-btn nav-next"
              onClick={() => onNavigate("next")}
            >
              <ChevronRight size={28} />
            </button>
          )}
        </div>

        {/* Bottom info */}
        <div className="lightbox-info">
          <span className="info-name">{media.originalFileName}</span>
          <span className="info-separator">·</span>
          {media.width && media.height && (
            <>
              <span className="info-dim">
                {media.width}×{media.height}
              </span>
              <span className="info-separator">·</span>
            </>
          )}
          <span className="info-size">{formatFileSize(media.fileSize)}</span>
          <span className="info-counter">
            {currentIndex + 1} / {allMedia.length}
          </span>
        </div>
      </StyledMediaLightbox>
    </StyledLightboxOverlay>,
    document.body
  );
}

export default MediaLightbox;

const StyledLightboxOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.85);
`;

const StyledMediaLightbox = styled.div`
  display: flex;
  flex-direction: column;
  width: 90vw;
  max-width: 1200px;
  height: 90vh;
  max-height: 90vh;
  user-select: none;

  .lightbox-topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 4px;
    flex-shrink: 0;
  }

  .topbar-actions {
    display: flex;
    gap: 4px;
  }

  .lightbox-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 10px;
    background: rgba(127, 184, 154, 0.12);
    color: #7fb89a;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &.delete-btn:hover {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }
  }

  .lightbox-viewer {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    min-height: 0;
    gap: 8px;
    padding: 0 8px;
  }

  .media-container {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 0;
    max-height: 100%;
  }

  .lightbox-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border-radius: 8px;
  }

  .lightbox-video {
    max-width: 100%;
    max-height: 100%;
    border-radius: 8px;
    outline: none;
  }

  .nav-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border: none;
    border-radius: 50%;
    background: rgba(127, 184, 154, 0.12);
    color: #7fb89a;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #9fcbae;
    }
  }

  .lightbox-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    flex-shrink: 0;
  }

  .info-name {
    font-size: 13px;
    font-weight: 500;
    color: #f1f3f2;
    max-width: 200px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .info-separator {
    color: #94a3a0;
    font-size: 12px;
  }

  .info-dim,
  .info-size {
    font-size: 12px;
    color: #94a3a0;
  }

  .info-counter {
    margin-left: auto;
    font-size: 12px;
    font-weight: 600;
    color: #9fcbae;
    background: rgba(127, 184, 154, 0.12);
    padding: 2px 10px;
    border-radius: 10px;
  }

  @media screen and (max-width: 600px) {
    width: 100vw;
    height: 100vh;
    max-height: 100vh;

    .nav-btn {
      width: 36px;
      height: 36px;
    }

    .info-name {
      max-width: 120px;
    }
  }
`;
