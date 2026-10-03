import { createPortal } from "react-dom";
import styled, { keyframes } from "styled-components";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  CheckSquare,
  CloudUpload,
  Download,
  Grid2x2,
  Grid3x3,
  Image as ImageIcon,
  LayoutGrid,
  Loader2,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { homeTokens } from "../../MainPage/MainBody/homeTokens";
import { TravelMediaType } from "../../../../types/travel/travelTypes";
import MediaGrid, { MediaCellSize } from "../common/media/MediaGrid/MediaGrid";
import MediaUploadZone from "../common/media/MediaUploadZone";
import MediaLightbox from "../common/media/MediaLightbox";
import { SORT_OPTIONS, useTravelAlbumPage } from "./useTravelAlbumPage";

const t = homeTokens;

const TYPE_TABS: { value: TravelMediaType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "image", label: "Photos" },
  { value: "video", label: "Videos" },
];

const CELL_SIZE_BUTTONS: { value: MediaCellSize; icon: typeof Grid3x3; title: string }[] = [
  { value: "s", icon: Grid3x3, title: "Small" },
  { value: "m", icon: LayoutGrid, title: "Medium" },
  { value: "l", icon: Grid2x2, title: "Large" },
];

/**
 * 프로젝트 앨범 전용 화면 (/travel/album/:travelId).
 * 대시보드의 Album 섹션은 미리보기만 담당하고, 전체 보기·업로드·일괄 관리는 여기서 한다.
 */
function TravelAlbumPage() {
  const s = useTravelAlbumPage();
  const { travelId, travel } = s;

  if (!travelId) return null;

  const showEmpty = !s.isLoading && !s.isError && s.media.length === 0;

  return (
    <Page {...s.dragHandlers}>
      <Inner>
        <Header>
          <BackButton onClick={() => s.navigate(`/travel/dashboard/${travelId}`)}>
            <ArrowLeft size={16} />
            Dashboard
          </BackButton>
          <TitleBlock>
            <Eyebrow>Album</Eyebrow>
            <Title>{travel?.title ?? (s.isTravelLoading ? "…" : "Travel")}</Title>
            <SubTitle>
              {s.imageCount} {s.imageCount === 1 ? "photo" : "photos"} · {s.videoCount}{" "}
              {s.videoCount === 1 ? "video" : "videos"}
            </SubTitle>
          </TitleBlock>
        </Header>

        <Toolbar>
          <Tabs role="tablist">
            {TYPE_TABS.map((tab) => {
              const count =
                tab.value === "image"
                  ? s.imageCount
                  : tab.value === "video"
                  ? s.videoCount
                  : s.totalCount;
              return (
                <TabButton
                  key={tab.value}
                  role="tab"
                  aria-selected={s.type === tab.value}
                  $active={s.type === tab.value}
                  onClick={() => s.setType(tab.value)}
                >
                  {tab.label}
                  <TabCount>{count}</TabCount>
                </TabButton>
              );
            })}
          </Tabs>

          <ToolbarRight>
            <SortSelect
              value={s.sort}
              onChange={(e) => s.setSort(e.target.value as typeof s.sort)}
              aria-label="Sort"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </SortSelect>

            <SegmentGroup aria-label="Thumbnail size">
              {CELL_SIZE_BUTTONS.map(({ value, icon: Icon, title }) => (
                <SegmentButton
                  key={value}
                  title={title}
                  $active={s.cellSize === value}
                  onClick={() => s.setCellSize(value)}
                >
                  <Icon size={15} />
                </SegmentButton>
              ))}
            </SegmentGroup>

            {s.media.length > 0 && (
              <ToolButton
                $active={s.isSelectMode}
                onClick={s.toggleSelectMode}
                title="Select"
              >
                <CheckSquare size={15} />
                <span>Select</span>
              </ToolButton>
            )}

            {s.canEdit && (
              <PrimaryButton
                $active={s.isUploadOpen}
                onClick={() => s.setIsUploadOpen((v) => !v)}
              >
                <Upload size={15} />
                <span>Upload</span>
              </PrimaryButton>
            )}
          </ToolbarRight>
        </Toolbar>

        <AnimatePresence>
          {s.isUploadOpen && s.canEdit && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ overflow: "hidden" }}
            >
              <MediaUploadZone
                travelId={travelId}
                onUploadComplete={() => s.setIsUploadOpen(false)}
                externalFiles={s.droppedFiles}
                onExternalFilesConsumed={s.handleDroppedFilesConsumed}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {s.isLoading ? (
          <StateBox>
            <Spinner />
            <span>Loading album…</span>
          </StateBox>
        ) : s.isError ? (
          <StateBox>
            <ImageIcon size={32} />
            <p>Couldn't load this album</p>
            <span>Check your connection and try again.</span>
          </StateBox>
        ) : showEmpty ? (
          <StateBox>
            <ImageIcon size={32} />
            <p>{s.type === "all" ? "No photos yet" : `No ${s.type === "image" ? "photos" : "videos"} yet`}</p>
            {s.canEdit ? (
              <span>Drag &amp; drop files anywhere on this page, or use Upload.</span>
            ) : (
              <span>Only members with edit access can upload.</span>
            )}
          </StateBox>
        ) : (
          <>
            <MediaGrid
              media={s.media}
              isSelectMode={s.isSelectMode}
              selectedIds={s.selectedIds}
              onSelect={s.handleSelect}
              onMediaClick={s.handleMediaClick}
              cellSize={s.cellSize}
            />
            <Sentinel ref={s.sentinelRef}>
              {s.isFetchingNextPage ? (
                <>
                  <Loader2 size={16} className="spin" />
                  Loading more…
                </>
              ) : s.hasNextPage ? (
                <span />
              ) : (
                <span className="end">
                  {s.media.length} of {s.currentCount} shown
                </span>
              )}
            </Sentinel>
          </>
        )}
      </Inner>

      {/* 페이지 전체 드래그 드롭 오버레이 */}
      {s.isDragActive && (
        <DropOverlay>
          <div>
            <CloudUpload size={40} />
            <p>Drop photos or videos to upload</p>
          </div>
        </DropOverlay>
      )}

      {/* 선택 모드 하단 액션 바 — transform 조상 영향을 피하려고 body 에 portal */}
      {s.isSelectMode &&
        createPortal(
          <SelectionBar>
            <div className="bar-inner">
              <span className="count">
                {s.selectedIds.size} selected
              </span>
              <button className="bar-btn" onClick={s.handleSelectAllLoaded}>
                {s.allLoadedSelected ? "Deselect all" : `Select all loaded (${s.media.length})`}
              </button>
              <div className="spacer" />
              <button
                className="bar-btn accent"
                onClick={s.handleBatchDownload}
                disabled={s.selectedIds.size === 0 || s.isDownloading}
              >
                {s.isDownloading ? <Loader2 size={15} className="spin" /> : <Download size={15} />}
                <span>{s.selectedIds.size > 1 ? "Download ZIP" : "Download"}</span>
              </button>
              {s.canEdit && (
                <button
                  className="bar-btn danger"
                  onClick={s.handleBatchDelete}
                  disabled={s.selectedIds.size === 0 || s.isDeleting}
                >
                  {s.isDeleting ? <Loader2 size={15} className="spin" /> : <Trash2 size={15} />}
                  <span>Delete</span>
                </button>
              )}
              <button className="bar-btn ghost" onClick={s.exitSelectMode} title="Exit selection">
                <X size={16} />
              </button>
            </div>
          </SelectionBar>,
          document.body
        )}

      <MediaLightbox
        isOpen={!!s.lightboxMedia}
        onClose={() => s.setLightboxMedia(null)}
        media={s.lightboxMedia}
        allMedia={s.media}
        travelId={travelId}
        onNavigate={s.handleLightboxNav}
        onDelete={s.handleDelete}
        canDelete={s.canEdit}
      />
    </Page>
  );
}

export default TravelAlbumPage;

/* ---------------------------------- styles --------------------------------- */

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const Page = styled.div`
  flex: 1;
  width: 100%;
  background: ${t.color.bg};
  padding: 28px 16px 120px;
  position: relative;

  .spin {
    animation: ${spin} 0.8s linear infinite;
  }
`;

const Inner = styled.div`
  max-width: ${t.containerMaxW};
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const BackButton = styled.button`
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: ${t.color.surface};
  border: 1px solid ${t.color.border};
  border-radius: ${t.radius.pill};
  font-size: 13px;
  color: ${t.color.textSoft};
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: ${t.color.border2};
    color: ${t.color.text};
  }
`;

const TitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Eyebrow = styled.span`
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${t.color.accent};
`;

const Title = styled.h1`
  font-family: ${t.font.serif};
  font-size: clamp(24px, 3.4vw, 34px);
  font-weight: 600;
  color: ${t.color.text};
  line-height: 1.2;
`;

const SubTitle = styled.span`
  font-size: 13px;
  color: ${t.color.textMuted};
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding-bottom: 12px;
  border-bottom: 1px solid ${t.color.border};
`;

const Tabs = styled.div`
  display: flex;
  gap: 4px;
  padding: 3px;
  background: ${t.color.surface};
  border: 1px solid ${t.color.border};
  border-radius: ${t.radius.pill};
`;

const TabButton = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  border-radius: ${t.radius.pill};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  background: ${(p) => (p.$active ? t.color.badgeBg : "transparent")};
  color: ${(p) => (p.$active ? t.color.text : t.color.textMuted)};
  transition: all 0.15s;

  &:hover {
    color: ${t.color.text};
  }
`;

const TabCount = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: ${t.color.accent};
`;

const ToolbarRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const SortSelect = styled.select`
  padding: 7px 28px 7px 12px;
  border: 1px solid ${t.color.border};
  border-radius: ${t.radius.md};
  background: ${t.color.surface};
  color: ${t.color.textSoft};
  font-size: 13px;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239aa399' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>");
  background-repeat: no-repeat;
  background-position: right 10px center;

  &:hover {
    border-color: ${t.color.border2};
  }

  option {
    background: ${t.color.surface};
    color: ${t.color.text};
  }
`;

const SegmentGroup = styled.div`
  display: inline-flex;
  padding: 3px;
  gap: 2px;
  background: ${t.color.surface};
  border: 1px solid ${t.color.border};
  border-radius: ${t.radius.md};
`;

const SegmentButton = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 28px;
  border: none;
  border-radius: 7px;
  cursor: pointer;
  background: ${(p) => (p.$active ? t.color.badgeBg : "transparent")};
  color: ${(p) => (p.$active ? t.color.text : t.color.textMuted)};
  transition: all 0.15s;

  &:hover {
    color: ${t.color.text};
  }
`;

const ToolButton = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border: 1px solid ${(p) => (p.$active ? t.color.accent : t.color.border)};
  border-radius: ${t.radius.md};
  background: ${(p) => (p.$active ? "rgba(143, 191, 148, 0.14)" : t.color.surface)};
  color: ${(p) => (p.$active ? t.color.accent : t.color.textSoft)};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: ${t.color.border2};
    color: ${t.color.text};
  }
`;

const PrimaryButton = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border: 1px solid transparent;
  border-radius: ${t.radius.md};
  background: ${(p) => (p.$active ? t.color.badgeBg : t.color.accentStrong)};
  color: ${(p) => (p.$active ? t.color.badgeText : "#fff")};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    filter: brightness(1.1);
  }
`;

const StateBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 4rem 1rem;
  color: ${t.color.textMuted};
  text-align: center;

  p {
    font-size: 15px;
    font-weight: 500;
    color: ${t.color.textSoft};
  }

  span {
    font-size: 13px;
  }
`;

const Spinner = styled.div`
  width: 28px;
  height: 28px;
  border: 3px solid rgba(143, 191, 148, 0.15);
  border-top-color: ${t.color.accent};
  border-radius: 50%;
  animation: ${spin} 0.7s linear infinite;
`;

const Sentinel = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 48px;
  padding: 12px;
  font-size: 13px;
  color: ${t.color.textMuted};

  .end {
    color: ${t.color.textFaint};
  }
`;

const DropOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 11, 10, 0.86);
  backdrop-filter: blur(2px);
  pointer-events: none;

  > div {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 40px 56px;
    border: 2px dashed ${t.color.accent};
    border-radius: 20px;
    color: ${t.color.accent};

    p {
      font-size: 15px;
      font-weight: 600;
      color: ${t.color.text};
    }
  }
`;

const SelectionBar = styled.div`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1100;
  padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
  background: rgba(20, 23, 20, 0.96);
  border-top: 1px solid ${t.color.border};
  backdrop-filter: blur(8px);

  .bar-inner {
    max-width: ${t.containerMaxW};
    margin: 0 auto;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .count {
    font-size: 13px;
    font-weight: 600;
    color: ${t.color.text};
    white-space: nowrap;
  }

  .spacer {
    flex: 1;
  }

  .bar-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border: 1px solid ${t.color.border};
    border-radius: ${t.radius.md};
    background: ${t.color.surface};
    color: ${t.color.textSoft};
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;

    &:hover:not(:disabled) {
      border-color: ${t.color.border2};
      color: ${t.color.text};
    }

    &:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    &.accent {
      background: rgba(143, 191, 148, 0.12);
      border-color: rgba(143, 191, 148, 0.35);
      color: ${t.color.accent};
    }

    &.danger {
      border-color: rgba(239, 68, 68, 0.3);
      color: #ef4444;

      &:hover:not(:disabled) {
        background: rgba(239, 68, 68, 0.08);
      }
    }

    &.ghost {
      border-color: transparent;
      background: transparent;
      padding: 8px;
    }
  }

  .spin {
    animation: ${spin} 0.8s linear infinite;
  }

  @media screen and (max-width: 600px) {
    .bar-btn span {
      display: none;
    }
    .bar-btn.accent span,
    .bar-btn.danger span {
      display: none;
    }
  }
`;
