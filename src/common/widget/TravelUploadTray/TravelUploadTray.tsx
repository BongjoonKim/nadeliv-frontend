import { useMemo, useState } from "react";
import styled from "styled-components";
import { useAtomValue } from "jotai";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, CloudUpload, X } from "lucide-react";
import { homeTokens } from "../../../component/page/MainPage/MainBody/homeTokens";
import { travelUploadZoneCountAtom } from "../../../stores/jotai/travelUploadAtom";
import { useTravelUploadEngine, useTravelUploadQueue } from "../../../hooks/useTravelMediaUpload";
import UploadQueueItem, { formatFileSize, ProgressTrack, summarizeUploads } from "./UploadQueueItem";

const t = homeTokens;

/**
 * Travel 앨범 전역 업로드 트레이.
 * 라우터 안에 한 번만 마운트 — 업로드 처리 루프를 돌리고, 업로드 존이 화면에 없을 때 우하단에 진행 상황을 띄운다.
 */
function TravelUploadTray() {
  useTravelUploadEngine();
  const { queue, cancel, retry, remove, clearFinished } = useTravelUploadQueue();
  const zoneCount = useAtomValue(travelUploadZoneCountAtom);
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  const summary = useMemo(() => summarizeUploads(queue), [queue]);
  const travelIds = useMemo(() => Array.from(new Set(queue.map((i) => i.travelId))), [queue]);

  if (queue.length === 0 || zoneCount > 0) return null;

  return (
    <StyledTravelUploadTray role="status" aria-live="polite">
      <div className="tray-header">
        <CloudUpload size={18} className="tray-icon" />
        <div className="tray-title">
          <span>
            {summary.isActive
              ? `Uploading ${Math.min(summary.doneCount + 1, summary.total)} of ${summary.total}`
              : `${summary.doneCount} of ${summary.total} uploaded${
                  summary.errorCount > 0 ? ` · ${summary.errorCount} failed` : ""
                }`}
          </span>
          <span className="tray-bytes">
            {formatFileSize(summary.loadedBytes)} / {formatFileSize(summary.totalBytes)} · {summary.percent}%
          </span>
        </div>
        <button
          className="tray-btn"
          title={expanded ? "Collapse" : "Expand"}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
        {!summary.isActive && (
          <button className="tray-btn" title="Close" onClick={() => clearFinished()}>
            <X size={16} />
          </button>
        )}
      </div>

      <ProgressTrack>
        <div className="progress-fill" style={{ width: `${summary.percent}%` }} />
      </ProgressTrack>

      {expanded && (
        <div className="tray-list">
          {queue.map((item) => (
            <UploadQueueItem
              key={item.id}
              item={item}
              onCancel={cancel}
              onRetry={retry}
              onRemove={remove}
            />
          ))}
        </div>
      )}

      {travelIds.length === 1 && (
        <button className="tray-link" onClick={() => navigate(`/travel/album/${travelIds[0]}`)}>
          Open album
        </button>
      )}
    </StyledTravelUploadTray>
  );
}

export default TravelUploadTray;

const StyledTravelUploadTray = styled.div`
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 1400;
  width: 360px;
  max-width: calc(100vw - 32px);
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border-radius: ${t.radius.lg};
  background: ${t.color.surface2};
  border: 1px solid ${t.color.border2};
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
  font-family: ${t.font.sans};

  .tray-header {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .tray-icon {
    color: ${t.color.accent};
    flex-shrink: 0;
  }

  .tray-title {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 13px;
    font-weight: 600;
    color: ${t.color.text};
  }

  .tray-bytes {
    font-size: 12px;
    font-weight: 500;
    color: ${t.color.textMuted};
  }

  .tray-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: ${t.color.textMuted};
    cursor: pointer;

    &:hover {
      background: rgba(255, 255, 255, 0.06);
      color: ${t.color.text};
    }
  }

  .tray-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 320px;
    overflow-y: auto;
  }

  .tray-link {
    align-self: flex-end;
    padding: 6px 12px;
    border: 1px solid ${t.color.border};
    border-radius: ${t.radius.md};
    background: transparent;
    color: ${t.color.textSoft};
    font-size: 12px;
    cursor: pointer;

    &:hover {
      border-color: ${t.color.border2};
      color: ${t.color.text};
    }
  }

  @media screen and (max-width: 600px) {
    right: 16px;
    bottom: 16px;
    left: 16px;
    width: auto;
    max-width: none;
  }
`;
