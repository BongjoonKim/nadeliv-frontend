import { ReactNode, useEffect, useState } from "react";
import styled from "styled-components";
import { Check, Film, ImageOff, Play } from "lucide-react";
import { TravelMedia } from "../../../../../../types/travel/travelTypes";
import { homeTokens } from "../../../../MainPage/MainBody/homeTokens";

const t = homeTokens;

/** 셀 크기 — 앨범 화면 툴바에서 토글. 대시보드 미리보기는 m 고정 */
export type MediaCellSize = "s" | "m" | "l";

const CELL_MIN_WIDTH: Record<MediaCellSize, number> = {
  s: 110,
  m: 150,
  l: 220,
};

// 모바일(≤600px) 열 수
const MOBILE_COLUMNS: Record<MediaCellSize, number> = {
  s: 4,
  m: 3,
  l: 2,
};

export interface MediaGridProps {
  media: TravelMedia[];
  isSelectMode: boolean;
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onMediaClick: (media: TravelMedia) => void;
  cellSize?: MediaCellSize;
  /** 그리드 마지막에 붙는 추가 셀 (예: 대시보드 "+N more") */
  trailing?: ReactNode;
}

const isVideoMime = (mimeType?: string) => !!mimeType && mimeType.startsWith("video/");

/**
 * 썸네일 이미지 + 실패 시 폴백.
 * 업로드 직후엔 Lambda 가 /thumbnails/*.jpg 를 아직 못 만든 경우가 있어
 * 썸네일 → 원본 → 플레이스홀더 순으로 내려간다. (영상 원본은 <img> 로 못 그리므로 바로 플레이스홀더)
 */
function MediaThumb({ item }: { item: TravelMedia }) {
  const isVideo = isVideoMime(item.mimeType);
  const [src, setSrc] = useState<string>(item.thumbnailUrl || item.fileUrl);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setSrc(item.thumbnailUrl || item.fileUrl);
    setFailed(false);
  }, [item.id, item.thumbnailUrl, item.fileUrl]);

  const handleError = () => {
    if (!isVideo && src !== item.fileUrl && item.fileUrl) {
      setSrc(item.fileUrl);
      return;
    }
    setFailed(true);
  };

  if (failed) {
    return (
      <div className="thumb-fallback" title={item.originalFileName}>
        {isVideo ? <Film size={22} /> : <ImageOff size={22} />}
        <span>{isVideo ? "Video" : "Preview unavailable"}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={item.originalFileName}
      loading="lazy"
      decoding="async"
      onError={handleError}
    />
  );
}

function MediaGrid({
  media,
  isSelectMode,
  selectedIds,
  onSelect,
  onMediaClick,
  cellSize = "m",
  trailing,
}: MediaGridProps) {
  const handleClick = (item: TravelMedia) => {
    if (isSelectMode) {
      onSelect(item.id);
    } else {
      onMediaClick(item);
    }
  };

  return (
    <StyledMediaGrid
      $minWidth={CELL_MIN_WIDTH[cellSize]}
      $mobileColumns={MOBILE_COLUMNS[cellSize]}
    >
      <div className="media-grid">
        {media.map((item) => {
          const selected = selectedIds.has(item.id);
          return (
            <div
              key={item.id}
              className={`media-cell ${selected ? "selected" : ""}`}
              onClick={() => handleClick(item)}
            >
              <MediaThumb item={item} />
              {isVideoMime(item.mimeType) && (
                <div className="video-overlay">
                  <div className="play-icon">
                    <Play size={20} fill="#fff" />
                  </div>
                </div>
              )}
              {isSelectMode && (
                <div
                  className={`select-checkbox ${selected ? "checked" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(item.id);
                  }}
                >
                  {selected && <Check size={14} color="#fff" />}
                </div>
              )}
            </div>
          );
        })}
        {trailing}
      </div>
    </StyledMediaGrid>
  );
}

export default MediaGrid;

const StyledMediaGrid = styled.div<{ $minWidth: number; $mobileColumns: number }>`
  .media-grid {
    display: grid;
    grid-template-columns: repeat(
      auto-fill,
      minmax(${(p) => p.$minWidth}px, 1fr)
    );
    gap: 8px;
  }

  .media-cell {
    position: relative;
    aspect-ratio: 1;
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    border: 2px solid transparent;
    background: ${t.color.surface3};
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;

    &:hover {
      transform: scale(1.02);
      box-shadow: 0 4px 16px rgba(143, 191, 148, 0.15);
    }

    &.selected {
      border-color: ${t.color.accent};
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
  }

  .thumb-fallback {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: ${t.color.textFaint};
    background: ${t.color.surface2};

    span {
      font-size: 11px;
      padding: 0 8px;
      text-align: center;
    }
  }

  .video-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.2);
    pointer-events: none;
  }

  .play-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(143, 191, 148, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    padding-left: 2px;
  }

  .select-checkbox {
    position: absolute;
    top: 8px;
    left: 8px;
    width: 24px;
    height: 24px;
    border-radius: 6px;
    border: 2px solid rgba(255, 255, 255, 0.8);
    background: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    z-index: 2;

    &.checked {
      background: ${t.color.accent};
      border-color: ${t.color.accent};
    }
  }

  @media screen and (max-width: 600px) {
    .media-grid {
      grid-template-columns: repeat(${(p) => p.$mobileColumns}, 1fr);
      gap: 4px;
    }

    .media-cell {
      border-radius: 8px;
    }
  }
`;
