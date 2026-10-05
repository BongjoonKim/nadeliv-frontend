import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import styled from "styled-components";
import { useSetAtom } from "jotai";
import { CloudUpload } from "lucide-react";
import { homeTokens } from "../../../../MainPage/MainBody/homeTokens";
import { useTravelUploadQueue } from "../../../../../../hooks/useTravelMediaUpload";
import { travelUploadZoneCountAtom } from "../../../../../../stores/jotai/travelUploadAtom";
import UploadQueueItem, {
  ProgressTrack,
  summarizeUploads,
  formatFileSize,
} from "../../../../../../common/widget/TravelUploadTray/UploadQueueItem";
import { toaster } from "../../../../../../common/elements/toaster";

const t = homeTokens;

export { formatFileSize };

export interface MediaUploadZoneProps {
  travelId: string;
  onUploadComplete: () => void;
  /** 부모(Album 섹션/앨범 페이지)에서 드래그 드롭으로 전달된 파일 */
  externalFiles?: File[] | null;
  onExternalFilesConsumed?: () => void;
}

/**
 * 업로드 존 — 파일을 전역 업로드 큐(travelUploadAtom)에 넣고, 이 프로젝트의 큐를 보여준다.
 * 실제 업로드(S3 presigned 직접 PUT)는 앱 루트의 TravelUploadTray 가 처리하므로
 * 이 존을 닫거나 다른 페이지로 가도 업로드는 계속된다.
 */
function MediaUploadZone({
  travelId,
  onUploadComplete,
  externalFiles,
  onExternalFilesConsumed,
}: MediaUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { queue, enqueue, cancel, retry, remove, clearFinished } = useTravelUploadQueue();
  const setZoneCount = useSetAtom(travelUploadZoneCountAtom);

  // 존이 떠 있는 동안 전역 트레이는 숨김 (같은 목록 중복 표시 방지)
  useEffect(() => {
    setZoneCount((c) => c + 1);
    return () => setZoneCount((c) => Math.max(0, c - 1));
  }, [setZoneCount]);

  const addFilesToQueue = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;
      const skipped = enqueue(travelId, files);
      const notes: string[] = [];
      if (skipped.unsupported > 0) notes.push(`${skipped.unsupported} not a photo or video`);
      if (skipped.tooLarge > 0) notes.push(`${skipped.tooLarge} over 5GB`);
      if (skipped.duplicates > 0) notes.push(`${skipped.duplicates} already queued`);
      if (notes.length > 0) {
        toaster.create({ title: `Skipped: ${notes.join(", ")}`, type: "warning", duration: 3000 });
      }
    },
    [enqueue, travelId]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      addFilesToQueue(Array.from(e.dataTransfer.files));
    },
    [addFilesToQueue]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        addFilesToQueue(Array.from(e.target.files));
        e.target.value = "";
      }
    },
    [addFilesToQueue]
  );

  // 부모 섹션에 드롭된 파일을 큐에 반영
  useEffect(() => {
    if (externalFiles && externalFiles.length > 0) {
      addFilesToQueue(externalFiles);
      onExternalFilesConsumed?.();
    }
  }, [externalFiles, addFilesToQueue, onExternalFilesConsumed]);

  const items = useMemo(() => queue.filter((i) => i.travelId === travelId), [queue, travelId]);
  const summary = useMemo(() => summarizeUploads(items), [items]);
  const allDone = items.length > 0 && !summary.isActive;

  return (
    <StyledMediaUploadZone>
      <div
        className={`dropzone ${isDragOver ? "drag-over" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,.heic,.heif"
          className="file-input"
          onChange={handleFileSelect}
        />
        <CloudUpload size={32} className="dropzone-icon" />
        <p className="dropzone-text">Drag photos or videos here</p>
        <span className="dropzone-sub">
          or click to browse · up to 5GB per file · keeps uploading if you leave this page
        </span>
      </div>

      {items.length > 0 && (
        <div className="upload-queue">
          {/* 전체 진행률 */}
          <div className="queue-summary">
            <div className="summary-text">
              {summary.isActive ? (
                <span>
                  Uploading {Math.min(summary.doneCount + 1, summary.total)} of {summary.total}
                </span>
              ) : (
                <span>
                  {summary.doneCount} of {summary.total} uploaded
                  {summary.errorCount > 0 && ` · ${summary.errorCount} failed`}
                </span>
              )}
              <span className="summary-bytes">
                {formatFileSize(summary.loadedBytes)} / {formatFileSize(summary.totalBytes)} ·{" "}
                {summary.percent}%
              </span>
            </div>
            <ProgressTrack>
              <div className="progress-fill" style={{ width: `${summary.percent}%` }} />
            </ProgressTrack>
          </div>

          {items.map((item) => (
            <UploadQueueItem
              key={item.id}
              item={item}
              onCancel={cancel}
              onRetry={retry}
              onRemove={remove}
            />
          ))}

          <div className="queue-footer">
            {items.some((i) => i.status === "done" || i.status === "cancelled") && (
              <button className="ghost-btn" onClick={() => clearFinished(travelId)}>
                Clear finished
              </button>
            )}
            {allDone ? (
              <button
                className="done-btn"
                onClick={() => {
                  clearFinished(travelId);
                  onUploadComplete();
                }}
              >
                Done
              </button>
            ) : (
              <button className="ghost-btn" onClick={onUploadComplete}>
                Hide
              </button>
            )}
          </div>
        </div>
      )}
    </StyledMediaUploadZone>
  );
}

export default MediaUploadZone;

const StyledMediaUploadZone = styled.div`
  margin-bottom: 16px;

  .dropzone {
    border: 2px dashed rgba(143, 191, 148, 0.45);
    border-radius: 16px;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.25s ease;
    background: rgba(255, 255, 255, 0.04);

    &:hover,
    &.drag-over {
      border-color: ${t.color.accent};
      border-style: solid;
      background: rgba(143, 191, 148, 0.12);
    }
  }

  .file-input {
    display: none;
  }

  .dropzone-icon {
    color: ${t.color.accent};
  }

  .dropzone-text {
    font-size: 15px;
    font-weight: 500;
    color: ${t.color.text};
  }

  .dropzone-sub {
    font-size: 13px;
    color: ${t.color.textMuted};
  }

  .upload-queue {
    margin-top: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .queue-summary {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px 12px;
    border-radius: 12px;
    background: ${t.color.surface};
    border: 1px solid ${t.color.border};
  }

  .summary-text {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    color: ${t.color.text};
  }

  .summary-bytes {
    font-size: 12px;
    font-weight: 500;
    color: ${t.color.textMuted};
    white-space: nowrap;
  }

  .queue-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
  }

  .ghost-btn {
    padding: 8px 14px;
    border: 1px solid ${t.color.border};
    border-radius: 10px;
    background: transparent;
    color: ${t.color.textSoft};
    font-size: 13px;
    cursor: pointer;

    &:hover {
      border-color: ${t.color.border2};
      color: ${t.color.text};
    }
  }

  .done-btn {
    padding: 8px 20px;
    border: none;
    border-radius: 10px;
    background: linear-gradient(135deg, #386851, #2f5743);
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s ease;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(143, 191, 148, 0.3);
    }
  }

  @media screen and (max-width: 600px) {
    .dropzone {
      padding: 1.5rem;
    }
  }
`;
