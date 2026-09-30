import React, { useState } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { Check, MapPin, Plus, Search, X } from "lucide-react";
import { homeTokens } from "../../MainPage/MainBody/homeTokens";
import { usePlaceQueries } from "../../../../hooks/usePlaceQueries";
import { PlaceItem } from "../../../../types/place/placeTypes";
import { locateRegion } from "../../../../utils/koreaRegionLocator";

const t = homeTokens;

interface PlaceSearchModalProps {
  open: boolean;
  onClose: () => void;
  /** 이미 추가된 장소 ID (뱃지 표시용) */
  addedIds: Set<string>;
  onSelect: (place: PlaceItem) => void;
  /** 헤더 문구 (기본: 다녀온 장소 추가) */
  eyebrow?: string;
  title?: string;
  /** 결과마다 "○○ on the map" 지역 뱃지 (Korea Map 전용 안내) */
  showRegionHint?: boolean;
}

/**
 * 다녀온 장소 검색·추가 모달 (Triple 스타일 — 장소만 고르고 순서·시간은 기록 안 함).
 * 검색은 백엔드 /api/place/search (카카오 + 영문 키워드 자동 번역) 재사용.
 * transform 조상이 position:fixed 를 깨뜨리므로 반드시 document.body 로 portal.
 */
const PlaceSearchModal: React.FC<PlaceSearchModalProps> = ({
  open,
  onClose,
  addedIds,
  onSelect,
  eyebrow = "Visited Places",
  title = "Add places you visited",
  showRegionHint = true,
}) => {
  const [keyword, setKeyword] = useState("");
  const search = usePlaceQueries();

  if (!open) return null;

  const results = search.data?.data?.places ?? [];

  const handleSearch = () => {
    const kw = keyword.trim();
    if (!kw || search.isPending) return;
    search.mutate({ keyword: kw });
  };

  const close = () => {
    setKeyword("");
    search.reset();
    onClose();
  };

  return createPortal(
    <Overlay onClick={close}>
      <Panel onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <PanelHeader>
          <div>
            <PanelEyebrow>{eyebrow}</PanelEyebrow>
            <PanelTitle>{title}</PanelTitle>
          </div>
          <CloseButton onClick={close} aria-label="Close">
            <X size={16} />
          </CloseButton>
        </PanelHeader>

        <SearchRow>
          <SearchInput
            autoFocus
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            placeholder="Search a place — e.g. 감천문화마을, Gamcheon Village"
          />
          <SearchButton onClick={handleSearch} disabled={!keyword.trim() || search.isPending}>
            <Search size={14} />
            {search.isPending ? "Searching…" : "Search"}
          </SearchButton>
        </SearchRow>

        {search.isError && (
          <ErrorNote>Search failed. Please try again.</ErrorNote>
        )}

        {search.isSuccess && results.length === 0 && (
          <EmptyNote>No places found. Try a different keyword.</EmptyNote>
        )}

        {results.length > 0 && (
          <ResultList>
            {results.map((p) => {
              const added = !!p.id && addedIds.has(p.id);
              const region = showRegionHint ? locateRegion(p.lat, p.lng) : null;
              return (
                <ResultRow key={p.id}>
                  <ResultInfo>
                    <ResultName>
                      {p.name}
                      {p.nameEn && p.nameEn !== p.name && <small>{p.nameEn}</small>}
                    </ResultName>
                    <ResultMeta>
                      {p.categoryEn || p.category}
                      {(p.roadAddressKo || p.addressKo) &&
                        ` · ${p.roadAddressKo || p.addressKo}`}
                    </ResultMeta>
                    {region && (
                      <RegionTag>
                        <MapPin size={10} />
                        {region.nameEn} on the map
                      </RegionTag>
                    )}
                  </ResultInfo>
                  <AddButton onClick={() => onSelect(p)} disabled={added}>
                    {added ? <Check size={13} /> : <Plus size={13} />}
                    {added ? "Added" : "Add"}
                  </AddButton>
                </ResultRow>
              );
            })}
          </ResultList>
        )}

        <Footer>
          <DoneButton onClick={close}>Done</DoneButton>
        </Footer>
      </Panel>
    </Overlay>,
    document.body
  );
};

export default PlaceSearchModal;

/* ──── Styled ──── */

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const Panel = styled.div`
  width: 100%;
  max-width: 520px;
  max-height: 84vh;
  display: flex;
  flex-direction: column;
  background: ${t.color.surface};
  border: 1px solid ${t.color.border};
  border-radius: ${t.radius.lg};
  padding: 20px;
  gap: 14px;
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
`;

const PanelEyebrow = styled.span`
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${t.color.accent};
`;

const PanelTitle = styled.h2`
  margin: 2px 0 0;
  font-family: ${t.font.serif};
  font-size: 20px;
  font-weight: 700;
  color: ${t.color.text};
`;

const CloseButton = styled.button`
  display: flex;
  padding: 6px;
  background: none;
  border: 1px solid ${t.color.border};
  border-radius: ${t.radius.pill};
  color: ${t.color.textSoft};
  cursor: pointer;

  &:hover {
    color: ${t.color.text};
    border-color: ${t.color.border2};
  }
`;

const SearchRow = styled.div`
  display: flex;
  gap: 8px;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 10px 14px;
  background: ${t.color.surface2};
  border: 1px solid ${t.color.border2};
  border-radius: ${t.radius.md};
  font-size: 13.5px;
  color: ${t.color.text};
  outline: none;

  &::placeholder {
    color: ${t.color.textFaint};
  }

  &:focus {
    border-color: ${t.color.accent};
  }
`;

const SearchButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  background: ${t.color.accentStrong};
  border: none;
  border-radius: ${t.radius.md};
  font-size: 13px;
  font-weight: 600;
  color: ${t.color.text};
  cursor: pointer;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: ${t.color.accent};
    color: ${t.color.bg};
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const ErrorNote = styled.p`
  margin: 0;
  font-size: 12.5px;
  color: #e07a6a;
`;

const EmptyNote = styled.p`
  margin: 0;
  padding: 18px 0;
  font-size: 13px;
  color: ${t.color.textMuted};
  text-align: center;
`;

const ResultList = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  border: 1px solid ${t.color.border};
  border-radius: ${t.radius.md};
`;

const ResultRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;

  & + & {
    border-top: 1px solid ${t.color.border};
  }
`;

const ResultInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const ResultName = styled.span`
  font-size: 13.5px;
  font-weight: 600;
  color: ${t.color.text};

  small {
    margin-left: 6px;
    font-weight: 400;
    font-size: 12px;
    color: ${t.color.textMuted};
  }
`;

const ResultMeta = styled.span`
  font-size: 12px;
  color: ${t.color.textMuted};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const RegionTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: ${t.color.accent};
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 13px;
  background: none;
  border: 1px solid ${t.color.border2};
  border-radius: ${t.radius.pill};
  font-size: 12.5px;
  color: ${t.color.textSoft};
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;

  &:hover:not(:disabled) {
    border-color: ${t.color.accent};
    color: ${t.color.text};
  }

  &:disabled {
    border-color: ${t.color.border};
    color: ${t.color.accent};
    cursor: default;
  }
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const DoneButton = styled.button`
  padding: 9px 18px;
  background: ${t.color.accentStrong};
  border: none;
  border-radius: ${t.radius.md};
  font-size: 13px;
  font-weight: 600;
  color: ${t.color.text};
  cursor: pointer;

  &:hover {
    background: ${t.color.accent};
    color: ${t.color.bg};
  }
`;
