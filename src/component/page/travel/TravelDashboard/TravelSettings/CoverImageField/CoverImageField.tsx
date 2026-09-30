import {useEffect, useRef, useState} from "react";
import styled, {keyframes} from "styled-components";
import {ImagePlus, Loader2, Trash2} from "lucide-react";
import useFileUpload from "../../../../../../hooks/useFileUpload";
import {useUpdateTravel} from "../../../../../../hooks/useTravelQueries";
import {uuid} from "../../../../../../utils/commonUtils";
import {ImageDecodeError, resizeImageFile} from "../../../../../../utils/imageResize";
import {homeTokens} from "../../../../MainPage/MainBody/homeTokens";
import {profileTokens} from "../../../../profile/profileUi";
import TravelProjectThumb from "../../../common/TravelProjectThumb";

// 리사이즈 전 원본 기준 상한 — 리사이즈 후 실제 업로드는 수백 KB 수준.
const MAX_SOURCE_BYTES = 20 * 1024 * 1024;

export interface CoverImageFieldProps {
  travelId: string;
  title: string;
  currentCoverImageUrl?: string;
}

function CoverImageField({travelId, title, currentCoverImageUrl}: CoverImageFieldProps) {
  const {upload} = useFileUpload();
  const updateTravel = useUpdateTravel();
  const inputRef = useRef<HTMLInputElement>(null);

  // 저장 직후 refetch 전까지 이전 사진이 깜빡이지 않도록 로컬로 들고 있는다.
  const [coverUrl, setCoverUrl] = useState(currentCoverImageUrl ?? "");
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCoverUrl(currentCoverImageUrl ?? "");
  }, [currentCoverImageUrl]);

  useEffect(() => {
    return () => {
      if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    };
  }, [pendingPreview]);

  const busy = isUploading || updateTravel.isPending;

  const handleFile = async (file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      setError("Image must be 20MB or smaller.");
      return;
    }

    setIsUploading(true);
    try {
      const resized = await resizeImageFile(file);
      setPendingPreview(URL.createObjectURL(resized));

      const url = await upload(`travel/${travelId}/cover-${uuid()}`, resized);
      await updateTravel.mutateAsync({travelId, reqBody: {coverImageUrl: url}});
      setCoverUrl(url);
    } catch (e) {
      setError(
        e instanceof ImageDecodeError
          ? "This image format isn't supported. Try JPG or PNG."
          : "Upload failed. Please try again."
      );
    } finally {
      setIsUploading(false);
      setPendingPreview(null);
    }
  };

  const handleRemove = async () => {
    setError(null);
    try {
      // 백엔드는 null 을 "변경 없음"으로 보므로 빈 문자열로 지운다.
      await updateTravel.mutateAsync({travelId, reqBody: {coverImageUrl: ""}});
      setCoverUrl("");
    } catch {
      setError("Couldn't remove the photo. Please try again.");
    }
  };

  return (
    <StyledCoverImageField>
      <div className={`cover-preview ${busy ? "busy" : ""}`}>
        <TravelProjectThumb
          seed={travelId}
          src={pendingPreview ?? (coverUrl || undefined)}
          alt={title}
        />
        {busy && (
          <div className="cover-busy">
            <Loader2 size={20} className="spin" />
          </div>
        )}
      </div>

      <div className="cover-info">
        <p className="cover-desc">
          Shown as the project thumbnail on Travel Home and the dashboard.
          Without a photo, a color is used.
        </p>
        <div className="cover-actions">
          <button
            type="button"
            className="btn-upload"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            <ImagePlus size={15} />
            {isUploading ? "Uploading..." : coverUrl ? "Change photo" : "Upload photo"}
          </button>
          {coverUrl && (
            <button
              type="button"
              className="btn-remove"
              onClick={handleRemove}
              disabled={busy}
            >
              <Trash2 size={14} />
              Remove
            </button>
          )}
        </div>
        {error && <p className="cover-error">{error}</p>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          // 같은 파일을 다시 골라도 onChange 가 뜨도록 초기화
          e.target.value = "";
          if (file) handleFile(file);
        }}
      />
    </StyledCoverImageField>
  );
}

export default CoverImageField;

const t = homeTokens;
const c = profileTokens;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const StyledCoverImageField = styled.div`
  display: flex;
  align-items: center;
  gap: 18px;

  .cover-preview {
    position: relative;
    width: 80px;
    height: 80px;
    flex-shrink: 0;
    border-radius: 50%;
    overflow: hidden;
    border: 0.5px solid ${t.color.border2};

    &.busy > :first-child {
      opacity: 0.55;
    }
  }

  .cover-busy {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${t.color.text};
  }

  .spin {
    animation: ${spin} 0.9s linear infinite;
  }

  .cover-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .cover-desc {
    margin: 0;
    font-size: 12.5px;
    line-height: 1.5;
    color: ${t.color.textMuted};
  }

  .cover-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .btn-upload,
  .btn-remove {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: ${t.radius.md};
    font-size: 13px;
    font-weight: 500;
    font-family: ${t.font.sans};
    cursor: pointer;
    transition: all 0.15s ease;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .btn-upload {
    border: 0.5px solid ${c.successBorder};
    background: ${c.successSurface};
    color: ${c.successText};

    &:hover:not(:disabled) {
      border-color: ${t.color.accent};
    }
  }

  .btn-remove {
    border: 0.5px solid ${t.color.border2};
    background: transparent;
    color: ${t.color.textSoft};

    &:hover:not(:disabled) {
      border-color: ${c.dangerBorder};
      background: ${c.dangerSurface};
      color: ${c.danger};
    }
  }

  .cover-error {
    margin: 0;
    font-size: 12px;
    color: ${c.danger};
  }

  @media (max-width: 420px) {
    align-items: flex-start;

    .cover-preview {
      width: 64px;
      height: 64px;
    }
  }
`;
