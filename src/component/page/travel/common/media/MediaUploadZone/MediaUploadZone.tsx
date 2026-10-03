import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import styled, { keyframes } from "styled-components";
import { CloudUpload, Check, AlertCircle, X, RotateCcw, Film } from "lucide-react";
import { useUploadTravelMedia } from "../../../../../../hooks/useTravelQueries";
import { homeTokens } from "../../../../MainPage/MainBody/homeTokens";

const t = homeTokens;

type UploadStatus = "pending" | "uploading" | "done" | "error" | "cancelled";

interface UploadItem {
  file: File;
  id: string;
  status: UploadStatus;
  /** 0~100 */
  progress: number;
  preview: string | null;
  controller?: AbortController;
  errorMessage?: string;
}

// 동시에 올리는 파일 수. 브라우저 커넥션·EC2 부하를 고려해 2개로 제한
const MAX_CONCURRENT_UPLOADS = 2;

export interface MediaUploadZoneProps {
  travelId: string;
  onUploadComplete: () => void;
  /** 부모(Album 섹션/앨범 페이지)에서 드래그 드롭으로 전달된 파일 */
  externalFiles?: File[] | null;
  onExternalFilesConsumed?: () => void;
}

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

function MediaUploadZone({
  travelId,
  onUploadComplete,
  externalFiles,
  onExternalFilesConsumed,
}: MediaUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadTravelMedia();
  // 뮤테이션 객체는 렌더마다 바뀌므로 ref 로 고정해 큐 처리 effect 의 재실행을 막는다
  const mutateRef = useRef(uploadMutation.mutateAsync);
  mutateRef.current = uploadMutation.mutateAsync;

  const addFilesToQueue = useCallback((files: File[]) => {
    const validFiles = files.filter(
      (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
    );
    if (validFiles.length === 0) return;

    setUploadQueue((prev) => {
      // 같은 이름·크기 파일이 이미 큐에 있으면 중복으로 보고 건너뜀
      const existing = new Set(prev.map((i) => `${i.file.name}:${i.file.size}`));
      const newItems: UploadItem[] = validFiles
        .filter((f) => !existing.has(`${f.name}:${f.size}`))
        .map((file) => ({
          file,
          id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
          status: "pending" as const,
          progress: 0,
          // 영상은 <img> 미리보기가 불가 → 아이콘으로 대체
          preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
        }));
      return [...prev, ...newItems];
    });
  }, []);

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

  const updateItem = useCallback((id: string, patch: Partial<UploadItem>) => {
    setUploadQueue((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }, []);

  const removeFromQueue = useCallback((id: string) => {
    setUploadQueue((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const cancelUpload = useCallback(
    (id: string) => {
      const item = uploadQueue.find((i) => i.id === id);
      item?.controller?.abort();
      updateItem(id, { status: "cancelled", controller: undefined });
    },
    [uploadQueue, updateItem]
  );

  const retryUpload = useCallback(
    (id: string) => {
      updateItem(id, { status: "pending", progress: 0, errorMessage: undefined });
    },
    [updateItem]
  );

  const clearFinished = useCallback(() => {
    setUploadQueue((prev) => {
      prev
        .filter((i) => i.status === "done" || i.status === "cancelled")
        .forEach((i) => i.preview && URL.revokeObjectURL(i.preview));
      return prev.filter((i) => i.status !== "done" && i.status !== "cancelled");
    });
  }, []);

  // 큐 처리: pending 중 앞에서부터 MAX_CONCURRENT_UPLOADS 개까지 동시 업로드
  useEffect(() => {
    const uploadingCount = uploadQueue.filter((i) => i.status === "uploading").length;
    if (uploadingCount >= MAX_CONCURRENT_UPLOADS) return;
    const nextItem = uploadQueue.find((i) => i.status === "pending");
    if (!nextItem) return;

    const controller = new AbortController();
    updateItem(nextItem.id, { status: "uploading", progress: 0, controller });

    mutateRef
      .current({
        travelId,
        file: nextItem.file,
        signal: controller.signal,
        onProgress: (percent) => updateItem(nextItem.id, { progress: percent }),
      })
      .then(() => {
        updateItem(nextItem.id, { status: "done", progress: 100, controller: undefined });
      })
      .catch((err: any) => {
        if (controller.signal.aborted) {
          updateItem(nextItem.id, { status: "cancelled", controller: undefined });
          return;
        }
        const message =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Upload failed";
        updateItem(nextItem.id, { status: "error", controller: undefined, errorMessage: message });
      });
  }, [uploadQueue, travelId, updateItem]);

  // 업로드 중 탭 닫기·새로고침 경고
  const isUploading = uploadQueue.some(
    (i) => i.status === "uploading" || i.status === "pending"
  );
  useEffect(() => {
    if (!isUploading) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isUploading]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      uploadQueue.forEach((item) => item.preview && URL.revokeObjectURL(item.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 전체 진행률 — 파일 크기 가중 평균
  const summary = useMemo(() => {
    const active = uploadQueue.filter((i) => i.status !== "cancelled");
    const totalBytes = active.reduce((acc, i) => acc + i.file.size, 0);
    const loadedBytes = active.reduce((acc, i) => {
      if (i.status === "done") return acc + i.file.size;
      if (i.status === "uploading") return acc + (i.file.size * i.progress) / 100;
      return acc;
    }, 0);
    const doneCount = active.filter((i) => i.status === "done").length;
    const errorCount = active.filter((i) => i.status === "error").length;
    return {
      total: active.length,
      doneCount,
      errorCount,
      totalBytes,
      loadedBytes,
      percent: totalBytes > 0 ? Math.round((loadedBytes / totalBytes) * 100) : 0,
    };
  }, [uploadQueue]);

  const allDone =
    uploadQueue.length > 0 &&
    uploadQueue.every(
      (i) => i.status === "done" || i.status === "error" || i.status === "cancelled"
    );

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
          accept="image/*,video/*"
          className="file-input"
          onChange={handleFileSelect}
        />
        <CloudUpload size={32} className="dropzone-icon" />
        <p className="dropzone-text">Drag photos or videos here</p>
        <span className="dropzone-sub">or click to browse · up to 500MB per file</span>
      </div>

      {uploadQueue.length > 0 && (
        <div className="upload-queue">
          {/* 전체 진행률 */}
          <div className="queue-summary">
            <div className="summary-text">
              {isUploading ? (
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
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${summary.percent}%` }} />
            </div>
          </div>

          {uploadQueue.map((item) => (
            <div key={item.id} className={`queue-item ${item.status}`}>
              {item.preview ? (
                <img src={item.preview} alt={item.file.name} className="queue-preview" />
              ) : (
                <div className="queue-preview queue-preview--video">
                  <Film size={18} />
                </div>
              )}
              <div className="queue-info">
                <div className="queue-row">
                  <span className="queue-name">{item.file.name}</span>
                  <span className="queue-size">
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
                  <div className="progress-track small">
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
                        retryUpload(item.id);
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
                      cancelUpload(item.id);
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
                {(item.status === "pending" ||
                  item.status === "error" ||
                  item.status === "cancelled") && (
                  <button
                    className="queue-icon-btn"
                    title="Remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromQueue(item.id);
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}

          <div className="queue-footer">
            {uploadQueue.some((i) => i.status === "done" || i.status === "cancelled") && (
              <button className="ghost-btn" onClick={clearFinished}>
                Clear finished
              </button>
            )}
            {allDone && (
              <button className="done-btn" onClick={onUploadComplete}>
                Done
              </button>
            )}
          </div>
        </div>
      )}
    </StyledMediaUploadZone>
  );
}

export default MediaUploadZone;

const shimmer = keyframes`
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
`;

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

  .progress-track {
    width: 100%;
    height: 6px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    overflow: hidden;

    &.small {
      height: 3px;
      margin-top: 4px;
    }
  }

  .progress-fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(
      90deg,
      ${t.color.accentStrong},
      ${t.color.accent},
      ${t.color.accentStrong}
    );
    background-size: 200% 100%;
    animation: ${shimmer} 1.6s linear infinite;
    transition: width 0.2s ease;
  }

  .queue-item {
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
  }

  .queue-preview {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    object-fit: cover;
    flex-shrink: 0;

    &--video {
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
