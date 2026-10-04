import styled, { keyframes } from "styled-components";
import { AlertCircle, Check, Film, Image as ImageIcon, RotateCcw, X } from "lucide-react";
import { homeTokens } from "../../../component/page/MainPage/MainBody/homeTokens";
import { TravelUploadItem } from "../../../stores/jotai/travelUploadAtom";
import { resolveMediaContentType } from "../../../hooks/useTravelMediaUpload";

const t = homeTokens;

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

/** 큐 전체 진행률 — 파일 크기 가중 평균 */
export const summarizeUploads = (items: TravelUploadItem[]) => {
  const active = items.filter((i) => i.status !== "cancelled");
  const totalBytes = active.reduce((acc, i) => acc + i.file.size, 0);
  const loadedBytes = active.reduce((acc, i) => {
    if (i.status === "done") return acc + i.file.size;
    if (i.status === "uploading" || i.status === "error") return acc + (i.file.size * i.progress) / 100;
    return acc;
  }, 0);
  const doneCount = active.filter((i) => i.status === "done").length;
  const errorCount = active.filter((i) => i.status === "error").length;
  const isActive = items.some((i) => i.status === "uploading" || i.status === "pending");
  return {
    total: active.length,
    doneCount,
    errorCount,
    totalBytes,
    loadedBytes,
    isActive,
    percent: totalBytes > 0 ? Math.round((loadedBytes / totalBytes) * 100) : 0,
  };
};

interface UploadQueueItemProps {
  item: TravelUploadItem;
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
}

function UploadQueueItem({ item, onCancel, onRetry, onRemove }: UploadQueueItemProps) {
  const isVideo = resolveMediaContentType(item.file).startsWith("video/");
  return (
    <StyledUploadQueueItem className={item.status}>
      {item.preview ? (
        <img src={item.preview} alt={item.file.name} className="queue-preview" />
      ) : (
        <div className="queue-preview queue-preview--icon">
          {isVideo ? <Film size={18} /> : <ImageIcon size={18} />}
        </div>
      )}
      <div className="queue-info">
        <div className="queue-row">
          <span className="queue-name">{item.file.name}</span>
          <span className="queue-size" title={item.errorMessage}>
            {item.status === "uploading"
              ? `${item.progress}%`
              : item.status === "cancelled"
              ? "Cancelled"
              : item.status === "error"
              ? item.errorMessage || "Failed"
              : formatFileSize(item.file.size)}
          </span>
        </div>
        {(item.status === "uploading" || item.status === "pending") && (
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${item.status === "uploading" ? item.progress : 0}%` }}
            />
          </div>
        )}
      </div>
      <div className="queue-status">
        {item.status === "done" && <Check size={16} className="status-done" />}
        {item.status === "error" && (
          <>
            <AlertCircle size={16} className="status-error" />
            <button
              className="queue-icon-btn"
              title="Retry"
              onClick={(e) => {
                e.stopPropagation();
                onRetry(item.id);
              }}
            >
              <RotateCcw size={14} />
            </button>
          </>
        )}
        {item.status === "uploading" && (
          <button
            className="queue-icon-btn"
            title="Cancel"
            onClick={(e) => {
              e.stopPropagation();
              onCancel(item.id);
            }}
          >
            <X size={14} />
          </button>
        )}
        {(item.status === "pending" || item.status === "error" || item.status === "cancelled") && (
          <button
            className="queue-icon-btn"
            title="Remove"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(item.id);
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>
    </StyledUploadQueueItem>
  );
}

export default UploadQueueItem;

const shimmer = keyframes`
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
`;

export const ProgressTrack = styled.div`
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;

  .progress-fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, ${t.color.accentStrong}, ${t.color.accent}, ${t.color.accentStrong});
    background-size: 200% 100%;
    animation: ${shimmer} 1.6s linear infinite;
    transition: width 0.2s ease;
  }
`;

const StyledUploadQueueItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 12px;
  background: ${t.color.surface};
  border: 1px solid ${t.color.border};

  &.done,
  &.cancelled {
    opacity: 0.6;
  }

  &.error {
    border-color: rgba(239, 68, 68, 0.3);
  }

  .queue-preview {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    object-fit: cover;
    flex-shrink: 0;

    &--icon {
      display: flex;
      align-items: center;
      justify-content: center;
      background: ${t.color.surface3};
      color: ${t.color.textMuted};
    }
  }

  .queue-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .queue-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
  }

  .queue-name {
    font-size: 13px;
    font-weight: 500;
    color: ${t.color.text};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .queue-size {
    font-size: 11px;
    color: ${t.color.textMuted};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 50%;
  }

  .progress-track {
    width: 100%;
    height: 3px;
    margin-top: 4px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, ${t.color.accentStrong}, ${t.color.accent}, ${t.color.accentStrong});
    background-size: 200% 100%;
    animation: ${shimmer} 1.6s linear infinite;
    transition: width 0.2s ease;
  }

  .queue-status {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .status-done {
    color: #22c55e;
  }

  .status-error {
    color: #ef4444;
  }

  .queue-icon-btn {
    display: flex;
    align-items: center;
    border: none;
    background: none;
    color: ${t.color.textMuted};
    cursor: pointer;
    padding: 2px;

    &:hover {
      color: ${t.color.text};
    }
  }
`;
