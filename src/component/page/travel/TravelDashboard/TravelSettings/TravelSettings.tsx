import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import styled, { keyframes } from "styled-components";
import {
  X,
  Pencil,
  Trash2,
  AlertTriangle,
  FileText,
  Tag,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Camera,
} from "lucide-react";
import { TravelVisibility } from "../../../../../types/travel/travelTypes";
import {
  useUpdateTravel,
  useDeleteTravel,
} from "../../../../../hooks/useTravelQueries";
import { homeTokens } from "../../../MainPage/MainBody/homeTokens";
import { profileTokens } from "../../../profile/profileUi";
import CoverImageField from "./CoverImageField";

export interface TravelSettingsProps {
  travelId: string;
  currentTitle: string;
  currentDescription?: string;
  currentTags?: string[];
  currentVisibility: TravelVisibility;
  currentCoverImageUrl?: string;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

function TravelSettings({
  travelId,
  currentTitle,
  currentDescription,
  currentTags,
  currentVisibility,
  currentCoverImageUrl,
  isOpen,
  onClose,
  onDeleted,
}: TravelSettingsProps) {
  // Title
  const [title, setTitle] = useState(currentTitle);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Description
  const [description, setDescription] = useState(currentDescription ?? "");
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const descRef = useRef<HTMLTextAreaElement>(null);

  // Tags
  const [tags, setTags] = useState<string[]>(currentTags ?? []);
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const tagInputRef = useRef<HTMLInputElement>(null);

  // Visibility
  const [visibility, setVisibility] = useState<TravelVisibility>(currentVisibility);

  // Delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");

  const updateTravel = useUpdateTravel();
  const deleteTravelMutation = useDeleteTravel();

  // 모달이 열릴 때만 props → 로컬 상태 동기화
  useEffect(() => {
    if (isOpen) {
      setTitle(currentTitle);
      setDescription(currentDescription ?? "");
      setTags(currentTags ?? []);
      setVisibility(currentVisibility);
      setIsEditingTitle(false);
      setIsEditingDesc(false);
      setIsEditingTags(false);
      setTagInput("");
      setShowDeleteConfirm(false);
      setDeleteInput("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (isEditingDesc && descRef.current) {
      descRef.current.focus();
    }
  }, [isEditingDesc]);

  useEffect(() => {
    if (isEditingTags && tagInputRef.current) {
      tagInputRef.current.focus();
    }
  }, [isEditingTags]);

  // body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  // 공통 업데이트 헬퍼
  const saveField = useCallback(
    async (reqBody: Record<string, unknown>) => {
      await updateTravel.mutateAsync({ travelId, reqBody });
    },
    [travelId, updateTravel]
  );

  // --- Title ---
  const handleSaveTitle = async () => {
    const trimmed = title.trim();
    if (!trimmed || trimmed === currentTitle) {
      setIsEditingTitle(false);
      setTitle(currentTitle);
      return;
    }
    try {
      await saveField({ title: trimmed });
      setIsEditingTitle(false);
    } catch {
      setTitle(currentTitle);
      setIsEditingTitle(false);
    }
  };

  // --- Description ---
  const handleSaveDesc = async () => {
    const trimmed = description.trim();
    if (trimmed === (currentDescription ?? "")) {
      setIsEditingDesc(false);
      return;
    }
    try {
      await saveField({ description: trimmed });
      setIsEditingDesc(false);
    } catch {
      setDescription(currentDescription ?? "");
      setIsEditingDesc(false);
    }
  };

  // --- Tags ---
  const addTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, "");
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSaveTags = async () => {
    try {
      await saveField({ tags });
      setIsEditingTags(false);
    } catch {
      setTags(currentTags ?? []);
      setIsEditingTags(false);
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  // --- Visibility ---
  const handleVisibilityChange = async (v: TravelVisibility) => {
    if (v === visibility) return;
    setVisibility(v);
    try {
      await saveField({ visibility: v });
    } catch {
      setVisibility(currentVisibility);
    }
  };

  // --- Delete ---
  const handleDelete = async () => {
    try {
      await deleteTravelMutation.mutateAsync(travelId);
      onDeleted();
    } catch {
      // React Query에서 처리
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSaveTitle();
    else if (e.key === "Escape") {
      setTitle(currentTitle);
      setIsEditingTitle(false);
    }
  };

  if (!isOpen) return null;

  const canDelete = deleteInput === currentTitle;

  // 대시보드 상위에 transform 을 가진 래퍼가 있어 position:fixed 가
  // 뷰포트가 아닌 그 래퍼 기준으로 잡힌다. body 로 portal 해서 분리한다.
  return createPortal(
    <Overlay onClick={onClose}>
      <StyledTravelSettings onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="settings-header">
          <h2>Project Settings</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="settings-body">
          {/* 커버 사진 — 홈 썸네일·대시보드 배너 */}
          <div className="settings-section">
            <div className="section-label">
              <Camera size={15} />
              Cover Photo
            </div>
            <CoverImageField
              travelId={travelId}
              title={currentTitle}
              currentCoverImageUrl={currentCoverImageUrl}
            />
          </div>

          {/* 프로젝트 이름 */}
          <div className="settings-section">
            <div className="section-label">
              <Pencil size={15} />
              Project Name
            </div>
            {isEditingTitle ? (
              <div className="edit-row">
                <input
                  ref={titleInputRef}
                  className="field-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={handleTitleKeyDown}
                  maxLength={100}
                  placeholder="Enter project name"
                />
                <div className="edit-actions">
                  <button
                    className="btn-cancel"
                    onClick={() => {
                      setTitle(currentTitle);
                      setIsEditingTitle(false);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-save"
                    onClick={handleSaveTitle}
                    disabled={
                      !title.trim() ||
                      title.trim() === currentTitle ||
                      updateTravel.isPending
                    }
                  >
                    {updateTravel.isPending ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="field-display"
                onClick={() => setIsEditingTitle(true)}
              >
                <span className="field-text">{currentTitle}</span>
                <Pencil size={14} className="edit-icon" />
              </div>
            )}
          </div>

          {/* Description */}
          <div className="settings-section">
            <div className="section-label">
              <FileText size={15} />
              Description
            </div>
            {isEditingDesc ? (
              <div className="edit-row">
                <textarea
                  ref={descRef}
                  className="field-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your travel project..."
                  rows={4}
                  maxLength={1000}
                />
                <div className="char-count">
                  {description.length}/1000
                </div>
                <div className="edit-actions">
                  <button
                    className="btn-cancel"
                    onClick={() => {
                      setDescription(currentDescription ?? "");
                      setIsEditingDesc(false);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-save"
                    onClick={handleSaveDesc}
                    disabled={
                      description.trim() === (currentDescription ?? "") ||
                      updateTravel.isPending
                    }
                  >
                    {updateTravel.isPending ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="field-display"
                onClick={() => setIsEditingDesc(true)}
              >
                <span
                  className={`field-text ${!currentDescription ? "placeholder" : ""}`}
                >
                  {currentDescription || "Add a description..."}
                </span>
                <Pencil size={14} className="edit-icon" />
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="settings-section">
            <div className="section-label">
              <Tag size={15} />
              Tags
            </div>
            {isEditingTags ? (
              <div className="edit-row">
                <div className="tags-editor">
                  {tags.map((tag) => (
                    <span key={tag} className="tag-chip editable">
                      #{tag}
                      <button
                        className="tag-remove"
                        onClick={() => removeTag(tag)}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  <input
                    ref={tagInputRef}
                    className="tag-input"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder={tags.length === 0 ? "Add tags..." : ""}
                    maxLength={30}
                  />
                </div>
                <span className="tag-hint">
                  Press Enter or comma to add a tag
                </span>
                <div className="edit-actions">
                  <button
                    className="btn-cancel"
                    onClick={() => {
                      setTags(currentTags ?? []);
                      setTagInput("");
                      setIsEditingTags(false);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-save"
                    onClick={handleSaveTags}
                    disabled={updateTravel.isPending}
                  >
                    {updateTravel.isPending ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="field-display"
                onClick={() => setIsEditingTags(true)}
              >
                <div className="tags-display">
                  {currentTags && currentTags.length > 0 ? (
                    currentTags.map((tag) => (
                      <span key={tag} className="tag-chip">
                        #{tag}
                      </span>
                    ))
                  ) : (
                    <span className="field-text placeholder">Add tags...</span>
                  )}
                </div>
                <Pencil size={14} className="edit-icon" />
              </div>
            )}
          </div>

          {/* Visibility */}
          <div className="settings-section">
            <div className="section-label">
              {visibility === "PUBLIC" ? <Globe size={15} /> : <Lock size={15} />}
              Visibility
            </div>
            <div className="visibility-options">
              <button
                className={`visibility-option ${visibility === "PUBLIC" ? "active" : ""}`}
                onClick={() => handleVisibilityChange("PUBLIC")}
                disabled={updateTravel.isPending}
              >
                <div className="vis-icon-wrap public">
                  <Eye size={16} />
                </div>
                <div className="vis-info">
                  <span className="vis-title">Public</span>
                  <span className="vis-desc">Anyone can view this project</span>
                </div>
              </button>
              <button
                className={`visibility-option ${visibility === "PRIVATE" ? "active" : ""}`}
                onClick={() => handleVisibilityChange("PRIVATE")}
                disabled={updateTravel.isPending}
              >
                <div className="vis-icon-wrap private">
                  <EyeOff size={16} />
                </div>
                <div className="vis-info">
                  <span className="vis-title">Private</span>
                  <span className="vis-desc">Only members can view</span>
                </div>
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="settings-section danger-zone">
            <div className="section-label danger">
              <Trash2 size={15} />
              Danger Zone
            </div>
            {!showDeleteConfirm ? (
              <button
                className="btn-delete-trigger"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 size={15} />
                Delete this project
              </button>
            ) : (
              <div className="delete-confirm">
                <div className="delete-warning">
                  <AlertTriangle size={16} />
                  <span>
                    This action <strong>cannot be undone</strong>. All data
                    including schedules, members, and media will be permanently
                    deleted.
                  </span>
                </div>
                <p className="delete-instruction">
                  Type <strong>{currentTitle}</strong> to confirm:
                </p>
                <input
                  className="delete-input"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder={currentTitle}
                />
                <div className="delete-actions">
                  <button
                    className="btn-cancel"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteInput("");
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-delete-confirm"
                    disabled={!canDelete || deleteTravelMutation.isPending}
                    onClick={handleDelete}
                  >
                    {deleteTravelMutation.isPending
                      ? "Deleting..."
                      : "Delete Project"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </StyledTravelSettings>
    </Overlay>,
    document.body
  );
}

export default TravelSettings;

const t = homeTokens;
const c = profileTokens;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(5, 6, 5, 0.66);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  /* 화면이 모달보다 짧아도 스크롤로 전체에 닿을 수 있게 */
  overflow-y: auto;
  padding: 24px 16px;
  animation: ${fadeIn} 0.2s ease;
`;

const StyledTravelSettings = styled.div`
  width: 100%;
  max-width: 520px;
  /* viewport 안에서 헤더는 고정, 본문만 스크롤되도록 */
  max-height: min(88vh, 760px);
  margin: auto;
  background: ${t.color.surface};
  border: 0.5px solid ${t.color.border};
  border-radius: ${t.radius.lg};
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.55);
  animation: ${slideUp} 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  color: ${t.color.text};
  font-family: ${t.font.sans};
  -webkit-font-smoothing: antialiased;

  .settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 0.5px solid ${t.color.border};
    flex-shrink: 0;

    h2 {
      font-family: ${t.font.serif};
      font-size: 20px;
      font-weight: 500;
      color: ${t.color.text};
      margin: 0;
    }
  }

  /* min-height:0 이 빠지면 flex 자식이 콘텐츠 높이로 고정되어
     모달 밖으로 넘쳐 잘리고 스크롤이 안 된다. (스크롤 버그 핵심) */
  .settings-body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;

    &::-webkit-scrollbar {
      width: 8px;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.12);
      border-radius: 4px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
  }

  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px;
    border: 0.5px solid transparent;
    background: ${c.hover};
    border-radius: ${t.radius.md};
    color: ${t.color.textMuted};
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: ${t.color.surface3};
      color: ${t.color.text};
    }
  }

  .settings-section {
    padding: 20px 24px;
    border-bottom: 0.5px solid ${t.color.border};

    &:last-child {
      border-bottom: none;
    }
  }

  .section-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 600;
    color: ${t.color.textMuted};
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;

    svg {
      color: ${t.color.textFaint};
    }

    &.danger {
      color: ${c.danger};

      svg {
        color: ${c.danger};
      }
    }
  }

  /* Field display (클릭하여 편집) */
  .field-display {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    border-radius: ${t.radius.md};
    border: 0.5px solid ${c.inputBorder};
    background: ${c.inputBg};
    cursor: pointer;
    transition: all 0.18s ease;
    gap: 12px;

    &:hover {
      border-color: ${t.color.border2};
      background: ${c.hover};

      .edit-icon {
        opacity: 1;
      }
    }
  }

  .field-text {
    font-size: 14px;
    font-weight: 400;
    color: ${t.color.text};
    flex: 1;
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.5;

    &.placeholder {
      color: ${t.color.textFaint};
    }
  }

  .edit-icon {
    color: ${t.color.textFaint};
    opacity: 0;
    transition: opacity 0.2s;
    flex-shrink: 0;
  }

  /* Edit row */
  .edit-row {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .field-input {
    width: 100%;
    padding: 12px 14px;
    border: 0.5px solid ${c.inputBorder};
    border-radius: ${t.radius.md};
    font-size: 14px;
    font-weight: 400;
    font-family: ${t.font.sans};
    color: ${t.color.text};
    outline: none;
    background: ${c.inputBg};
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
    box-sizing: border-box;
    color-scheme: dark;

    &::placeholder {
      color: ${t.color.textFaint};
    }

    &:focus {
      border-color: ${t.color.accent};
      box-shadow: 0 0 0 3px rgba(143, 191, 148, 0.14);
    }
  }

  .field-textarea {
    width: 100%;
    padding: 12px 14px;
    border: 0.5px solid ${c.inputBorder};
    border-radius: ${t.radius.md};
    font-size: 14px;
    font-weight: 400;
    color: ${t.color.text};
    outline: none;
    background: ${c.inputBg};
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
    box-sizing: border-box;
    resize: vertical;
    min-height: 88px;
    font-family: ${t.font.sans};
    line-height: 1.6;
    color-scheme: dark;

    &::placeholder {
      color: ${t.color.textFaint};
    }

    &:focus {
      border-color: ${t.color.accent};
      box-shadow: 0 0 0 3px rgba(143, 191, 148, 0.14);
    }
  }

  .char-count {
    text-align: right;
    font-size: 11px;
    color: ${t.color.textFaint};
  }

  .edit-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .btn-cancel {
    padding: 8px 16px;
    border: 0.5px solid ${t.color.border2};
    background: transparent;
    border-radius: ${t.radius.md};
    font-size: 13px;
    font-weight: 500;
    font-family: ${t.font.sans};
    color: ${t.color.textSoft};
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
      background: ${c.hover};
      border-color: rgba(255, 255, 255, 0.3);
    }
  }

  .btn-save {
    padding: 8px 20px;
    border: none;
    background: ${t.color.accentStrong};
    border-radius: ${t.radius.md};
    font-size: 13px;
    font-weight: 600;
    font-family: ${t.font.sans};
    color: #eef7ef;
    cursor: pointer;
    transition: filter 0.15s ease, opacity 0.15s ease;

    &:hover:not(:disabled) {
      filter: brightness(1.1);
    }

    &:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
  }

  /* Tags */
  .tags-display {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    flex: 1;
  }

  .tag-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 12px;
    border-radius: ${t.radius.pill};
    background: ${t.color.badgeBg};
    color: ${t.color.badgeText};
    font-size: 13px;
    font-weight: 500;

    &.editable {
      padding-right: 6px;
    }
  }

  .tag-remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border: none;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    color: ${t.color.badgeText};
    cursor: pointer;
    transition: all 0.15s ease;
    padding: 0;

    &:hover {
      background: ${c.dangerSurface};
      color: ${c.danger};
    }
  }

  .tags-editor {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 10px 12px;
    border: 0.5px solid ${c.inputBorder};
    border-radius: ${t.radius.md};
    background: ${c.inputBg};
    min-height: 44px;
    align-items: center;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;

    &:focus-within {
      border-color: ${t.color.accent};
      box-shadow: 0 0 0 3px rgba(143, 191, 148, 0.14);
    }
  }

  .tag-input {
    border: none;
    outline: none;
    background: transparent;
    font-size: 14px;
    font-family: ${t.font.sans};
    color: ${t.color.text};
    min-width: 80px;
    flex: 1;

    &::placeholder {
      color: ${t.color.textFaint};
    }
  }

  .tag-hint {
    font-size: 11px;
    color: ${t.color.textFaint};
  }

  /* Visibility */
  .visibility-options {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .visibility-option {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    border: 0.5px solid ${c.inputBorder};
    border-radius: ${t.radius.md};
    background: transparent;
    cursor: pointer;
    transition: all 0.18s ease;
    text-align: left;
    width: 100%;

    &:hover {
      border-color: ${t.color.border2};
      background: ${c.hover};
    }

    &.active {
      border-color: ${t.color.accent};
      background: ${c.successSurface};
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .vis-icon-wrap {
    width: 36px;
    height: 36px;
    border-radius: ${t.radius.md};
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &.public {
      background: ${c.successSurface};
      color: ${t.color.accent};
    }

    &.private {
      background: rgba(255, 255, 255, 0.06);
      color: ${t.color.textMuted};
    }
  }

  .vis-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .vis-title {
    font-size: 14px;
    font-weight: 600;
    color: ${t.color.text};
  }

  .vis-desc {
    font-size: 12px;
    color: ${t.color.textMuted};
  }

  /* Danger zone */
  .danger-zone {
    background: ${c.dangerSurface};
  }

  .btn-delete-trigger {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    border: 0.5px solid ${c.dangerBorder};
    border-radius: ${t.radius.md};
    background: transparent;
    color: ${c.danger};
    font-size: 14px;
    font-weight: 500;
    font-family: ${t.font.sans};
    cursor: pointer;
    transition: all 0.18s ease;

    &:hover {
      background: ${c.dangerSurface};
      border-color: ${c.danger};
    }
  }

  .delete-confirm {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .delete-warning {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 14px;
    background: ${c.dangerSurface};
    border: 0.5px solid ${c.dangerBorder};
    border-radius: ${t.radius.md};
    color: ${c.danger};
    font-size: 13px;
    line-height: 1.5;

    strong {
      color: ${c.danger};
      font-weight: 700;
    }

    svg {
      flex-shrink: 0;
      margin-top: 2px;
    }
  }

  .delete-instruction {
    font-size: 13px;
    color: ${t.color.textMuted};
    margin: 0;

    strong {
      color: ${t.color.text};
      font-weight: 600;
    }
  }

  .delete-input {
    width: 100%;
    padding: 10px 14px;
    border: 0.5px solid ${c.dangerBorder};
    border-radius: ${t.radius.md};
    font-size: 14px;
    font-family: ${t.font.sans};
    color: ${t.color.text};
    background: ${c.inputBg};
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
    color-scheme: dark;

    &::placeholder {
      color: ${t.color.textFaint};
    }

    &:focus {
      border-color: ${c.danger};
      box-shadow: 0 0 0 3px rgba(220, 90, 80, 0.14);
    }
  }

  .delete-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .btn-delete-confirm {
    padding: 8px 20px;
    border: none;
    background: ${c.dangerStrong};
    border-radius: ${t.radius.md};
    font-size: 13px;
    font-weight: 600;
    font-family: ${t.font.sans};
    color: #fdeceb;
    cursor: pointer;
    transition: filter 0.15s ease, opacity 0.15s ease;

    &:hover:not(:disabled) {
      filter: brightness(1.12);
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }
`;
