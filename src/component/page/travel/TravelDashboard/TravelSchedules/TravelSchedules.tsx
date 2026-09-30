import React, { useState } from "react";
import styled from "styled-components";
import {
  CalendarDays,
  Clock,
  GripVertical,
  MapPin,
  NotebookPen,
  Plus,
  Trash2,
} from "lucide-react";
import { homeTokens } from "../../../MainPage/MainBody/homeTokens";
import { profileTokens } from "../../../profile/profileUi";
import { TravelResponse } from "../../../../../types/travel/travelTypes";
import PlaceSearchModal from "../../TravelMap/PlaceSearchModal";
import ScheduleItemModal, { ScheduleItemValues } from "./ScheduleItemModal";
import { useDragReorder, useTravelSchedules } from "./useTravelSchedules";
import {
  categoryColor,
  distanceMeters,
  formatDistance,
  placeMetaLine,
  totalDistance,
} from "./scheduleUtils";

const t = homeTokens;

export interface TravelSchedulesProps {
  travel: TravelResponse;
  canEdit: boolean;
}

type EditorState = { mode: "create" } | { mode: "edit"; index: number };

/**
 * 대시보드 Schedules 섹션 — Triple 식 하루 코스 플래너.
 * Day 탭 → 번호 타임라인(카테고리 색 핀, 시각, 구간 직선 거리) → 장소 검색/직접 입력으로 추가.
 * Edit 모드에서 드래그 정렬·삭제, 항목 클릭으로 시각·메모·날 이동.
 */
function TravelSchedules({ travel, canEdit }: TravelSchedulesProps) {
  const s = useTravelSchedules(travel);
  const [editMode, setEditMode] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [editor, setEditor] = useState<EditorState | null>(null);

  const { listRef, displayItems, dragIndex, startDrag } = useDragReorder(
    s.items,
    (next) => s.reorder(s.day, next)
  );

  const selected = s.days.find((d) => d.number === s.day);
  const dayDistance = totalDistance(s.items);
  const editingItem = editor?.mode === "edit" ? s.items[editor.index] : undefined;

  const handleEditorSave = (values: ScheduleItemValues) => {
    if (!editor) return;
    const patch = { name: values.name, time: values.time, memo: values.memo };
    if (editor.mode === "create") {
      s.addCustom(s.day, patch);
    } else if (values.day !== s.day) {
      s.moveItem(s.day, editor.index, values.day, patch);
    } else {
      s.updateItem(s.day, editor.index, patch);
    }
    setEditor(null);
  };

  const handleEditorRemove = () => {
    if (editor?.mode !== "edit") return;
    s.removeItem(s.day, editor.index);
    setEditor(null);
  };

  const placeIdsOfDay = new Set(
    s.items.map((it) => it.placeId).filter((id): id is string => !!id)
  );

  return (
    <div>
      <div className="section-header">
        <h3 className="section-title">
          <Clock size={16} />
          Schedules
        </h3>
        <HeaderActions>
          {s.saving && <SavingNote>Saving…</SavingNote>}
          {canEdit && (editMode || s.items.length > 0) && (
            <TextButton onClick={() => setEditMode((v) => !v)}>
              {editMode ? "Done" : "Edit"}
            </TextButton>
          )}
        </HeaderActions>
      </div>

      {/* Day 탭 */}
      <DayTabs role="tablist" aria-label="Trip days">
        {s.days.map((d) => (
          <DayTab
            key={d.number}
            role="tab"
            aria-selected={d.number === s.day}
            $active={d.number === s.day}
            onClick={() => s.selectDay(d.number)}
          >
            <strong>Day {d.number}</strong>
            {d.date && (
              <span>
                {d.date.date} {d.date.weekday}
              </span>
            )}
            {d.count > 0 && <em>{d.count}</em>}
          </DayTab>
        ))}
        {canEdit && !s.hasTripDates && (
          <AddDayTab onClick={s.addDay} aria-label="Add a day">
            <Plus size={13} />
            Day
          </AddDayTab>
        )}
      </DayTabs>

      {/* 선택한 날 헤더 */}
      <DayHeader>
        <DayTitle>Day {s.day}</DayTitle>
        {selected?.date && (
          <DayDate>
            {selected.date.date} · {selected.date.weekday}
          </DayDate>
        )}
        {s.items.length > 0 && (
          <DaySummary>
            {s.items.length} {s.items.length === 1 ? "stop" : "stops"}
            {dayDistance > 0 && ` · ${formatDistance(dayDistance)}`}
          </DaySummary>
        )}
      </DayHeader>

      {s.items.length === 0 ? (
        <EmptyDay>
          <CalendarDays size={28} />
          <p>Nothing planned for Day {s.day} yet</p>
          {canEdit && <span>Search places to build the route for this day.</span>}
        </EmptyDay>
      ) : (
        <Timeline ref={listRef}>
          {displayItems.map((item, i) => {
            const prev = displayItems[i - 1];
            const dist = prev ? distanceMeters(prev, item) : null;
            const meta = placeMetaLine(item);
            const isFirst = i === 0;
            const isLast = i === displayItems.length - 1;
            return (
              <React.Fragment key={item.id ?? `${i}-${item.name}`}>
                {i > 0 && (
                  <Leg>
                    <LegRail>
                      {dist != null && (
                        <LegChip title="Straight-line distance">{formatDistance(dist)}</LegChip>
                      )}
                    </LegRail>
                  </Leg>
                )}
                <Stop data-schedule-item $dragging={dragIndex === i}>
                  <Rail $first={isFirst} $last={isLast}>
                    <Pin style={{ background: categoryColor(item) }}>{i + 1}</Pin>
                    {item.time && <PinTime>{item.time}</PinTime>}
                  </Rail>
                  <StopCard
                    as={canEdit ? "button" : "div"}
                    $clickable={canEdit}
                    onClick={canEdit ? () => setEditor({ mode: "edit", index: i }) : undefined}
                  >
                    <StopBody>
                      <StopName>
                        {item.name}
                        {item.nameEn && item.nameEn !== item.name && (
                          <small>{item.nameEn}</small>
                        )}
                      </StopName>
                      {meta && <StopMeta>{meta}</StopMeta>}
                      {item.memo && <StopMemo>{item.memo}</StopMemo>}
                    </StopBody>
                  </StopCard>
                  {canEdit && editMode && (
                    <StopTools>
                      <ToolButton
                        onClick={() => s.removeItem(s.day, i)}
                        aria-label={`Remove ${item.name}`}
                        title="Remove"
                      >
                        <Trash2 size={14} />
                      </ToolButton>
                      <DragHandle
                        onPointerDown={(e) => startDrag(i, e)}
                        aria-label="Drag to reorder"
                        title="Drag to reorder"
                      >
                        <GripVertical size={16} />
                      </DragHandle>
                    </StopTools>
                  )}
                </Stop>
              </React.Fragment>
            );
          })}
        </Timeline>
      )}

      {canEdit && editMode && s.items.length > 0 && (
        <Hint>Drag the handle to reorder. Tap a stop to set a time, add a memo, or move it to another day.</Hint>
      )}

      {s.error && <ErrorNote>{s.error}</ErrorNote>}

      {canEdit && (
        <AddRow $indent={s.items.length > 0}>
          <AddButton onClick={() => setSearchOpen(true)}>
            <MapPin size={14} />
            Add place
          </AddButton>
          <AddButton onClick={() => setEditor({ mode: "create" })}>
            <NotebookPen size={14} />
            Add plan
          </AddButton>
        </AddRow>
      )}

      <PlaceSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        addedIds={placeIdsOfDay}
        onSelect={(p) => s.addPlace(s.day, p)}
        eyebrow={`Schedules · Day ${s.day}`}
        title="Add places to this day"
        showRegionHint={false}
      />

      {editor && (editor.mode === "create" || editingItem) && (
        <ScheduleItemModal
          mode={editor.mode}
          item={editingItem}
          day={s.day}
          days={s.days}
          onClose={() => setEditor(null)}
          onSave={handleEditorSave}
          onRemove={handleEditorRemove}
        />
      )}
    </div>
  );
}

export default TravelSchedules;

/* ──── Styled ──── */

const RAIL_W = 56;
const PIN = 26;
const PIN_TOP = 14; // 카드 제목 줄과 핀 중앙 정렬

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const SavingNote = styled.span`
  font-size: 12px;
  color: ${t.color.textMuted};
`;

const TextButton = styled.button`
  padding: 4px 2px;
  background: none;
  border: none;
  font-size: 13px;
  font-weight: 600;
  color: ${t.color.textSoft};
  cursor: pointer;

  &:hover {
    color: ${t.color.accent};
  }
`;

const DayTabs = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  margin-bottom: 18px;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const DayTab = styled.button<{ $active: boolean }>`
  flex-shrink: 0;
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 7px 14px;
  border-radius: ${t.radius.pill};
  border: 1px solid ${(p) => (p.$active ? t.color.accent : t.color.border)};
  background: ${(p) => (p.$active ? t.color.badgeBg : "transparent")};
  font-family: ${t.font.sans};
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;

  strong {
    font-size: 13px;
    font-weight: 700;
    color: ${(p) => (p.$active ? t.color.text : t.color.textSoft)};
  }

  span {
    font-size: 12px;
    color: ${(p) => (p.$active ? t.color.badgeText : t.color.textMuted)};
  }

  em {
    font-style: normal;
    font-size: 11px;
    font-weight: 600;
    color: ${t.color.accent};
  }

  &:hover {
    border-color: ${(p) => (p.$active ? t.color.accent : t.color.border2)};
  }
`;

const AddDayTab = styled.button`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 7px 14px;
  border-radius: ${t.radius.pill};
  border: 1px dashed ${t.color.border2};
  background: none;
  font-size: 13px;
  color: ${t.color.textMuted};
  cursor: pointer;

  &:hover {
    color: ${t.color.text};
    border-color: ${t.color.accent};
  }
`;

const DayHeader = styled.div`
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 4px 10px;
  margin-bottom: 14px;
`;

const DayTitle = styled.h4`
  margin: 0;
  font-family: ${t.font.serif};
  font-size: 20px;
  font-weight: 700;
  color: ${t.color.text};
`;

const DayDate = styled.span`
  font-size: 14px;
  color: ${t.color.textMuted};
`;

const DaySummary = styled.span`
  margin-left: auto;
  font-size: 12.5px;
  color: ${t.color.textMuted};
`;

const EmptyDay = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 2.25rem 1rem;
  border: 1px dashed ${t.color.border2};
  border-radius: ${t.radius.lg};
  color: ${t.color.textFaint};
  text-align: center;

  p {
    margin: 4px 0 0;
    font-size: 14.5px;
    font-weight: 500;
    color: ${t.color.textSoft};
  }

  span {
    font-size: 13px;
    color: ${t.color.textMuted};
  }
`;

const Timeline = styled.div`
  display: flex;
  flex-direction: column;
`;

const Stop = styled.div<{ $dragging: boolean }>`
  display: flex;
  align-items: stretch;
  opacity: ${(p) => (p.$dragging ? 0.6 : 1)};
  transition: opacity 0.15s;
`;

// 번호 핀 + 세로 연결선 (첫 항목은 위, 마지막 항목은 아래 선 없음)
const Rail = styled.div<{ $first: boolean; $last: boolean }>`
  position: relative;
  flex-shrink: 0;
  width: ${RAIL_W}px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: ${PIN_TOP}px;

  &::before,
  &::after {
    content: "";
    position: absolute;
    left: 50%;
    width: 1px;
    background: ${t.color.border2};
    transform: translateX(-50%);
  }

  &::before {
    top: 0;
    height: ${PIN_TOP}px;
    display: ${(p) => (p.$first ? "none" : "block")};
  }

  &::after {
    top: ${PIN_TOP + PIN}px;
    bottom: 0;
    display: ${(p) => (p.$last ? "none" : "block")};
  }
`;

const Pin = styled.span`
  position: relative;
  z-index: 1;
  width: ${PIN}px;
  height: ${PIN}px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12.5px;
  font-weight: 700;
  color: ${t.color.text};
  box-shadow: 0 0 0 3px ${t.color.bg};
`;

const PinTime = styled.span`
  position: relative;
  z-index: 1;
  margin-top: 6px;
  padding: 1px 3px;
  background: ${t.color.bg};
  font-size: 11px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: ${t.color.textSoft};
`;

const StopCard = styled.div<{ $clickable: boolean }>`
  flex: 1;
  min-width: 0;
  display: flex;
  padding: 12px 16px;
  background: ${t.color.surface};
  border: 1px solid ${t.color.border};
  border-radius: ${t.radius.lg};
  font-family: ${t.font.sans};
  text-align: left;
  color: inherit;
  cursor: ${(p) => (p.$clickable ? "pointer" : "default")};
  transition: border-color 0.15s, background 0.15s;

  &:hover {
    ${(p) => (p.$clickable ? `border-color: ${t.color.border2}; background: ${t.color.surface3};` : "")}
  }

  &:focus-visible {
    outline: 2px solid ${t.color.accent};
    outline-offset: 2px;
  }
`;

const StopBody = styled.span`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const StopName = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: ${t.color.text};
  line-height: 1.45;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  small {
    margin-left: 6px;
    font-size: 12px;
    font-weight: 400;
    color: ${t.color.textMuted};
  }
`;

const StopMeta = styled.span`
  font-size: 12.5px;
  color: ${t.color.textMuted};
`;

const StopMemo = styled.span`
  margin-top: 3px;
  font-size: 13.5px;
  color: ${t.color.textSoft};
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
`;

const StopTools = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  padding-left: 6px;
`;

const ToolButton = styled.button`
  display: flex;
  padding: 8px;
  background: none;
  border: none;
  border-radius: ${t.radius.md};
  color: ${t.color.textMuted};
  cursor: pointer;

  &:hover {
    color: ${profileTokens.danger};
    background: ${profileTokens.dangerSurface};
  }
`;

const DragHandle = styled.button`
  display: flex;
  padding: 8px 4px;
  background: none;
  border: none;
  color: ${t.color.textMuted};
  cursor: grab;
  touch-action: none;

  &:hover {
    color: ${t.color.text};
  }

  &:active {
    cursor: grabbing;
  }
`;

// 구간: 세로선 위에 직선 거리 칩
const Leg = styled.div`
  display: flex;
  min-height: 12px;
`;

const LegRail = styled.div`
  position: relative;
  width: ${RAIL_W}px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px 0;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: 1px;
    background: ${t.color.border2};
    transform: translateX(-50%);
  }
`;

const LegChip = styled.span`
  position: relative;
  z-index: 1;
  padding: 2px 7px;
  background: ${t.color.surface2};
  border: 1px solid ${t.color.border2};
  border-radius: ${t.radius.pill};
  font-size: 10.5px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: ${t.color.textSoft};
  white-space: nowrap;
`;

const Hint = styled.p`
  margin: 12px 0 0;
  font-size: 12px;
  color: ${t.color.textMuted};
`;

const ErrorNote = styled.p`
  margin: 12px 0 0;
  font-size: 12.5px;
  color: ${profileTokens.danger};
`;

// 타임라인이 있을 때만 카드 열에 맞춰 들여쓰기
const AddRow = styled.div<{ $indent: boolean }>`
  display: flex;
  gap: 8px;
  margin-top: 14px;
  padding-left: ${(p) => (p.$indent ? RAIL_W : 0)}px;

  @media screen and (max-width: 600px) {
    padding-left: 0;
  }
`;

const AddButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 11px 14px;
  background: none;
  border: 1px dashed ${t.color.border2};
  border-radius: ${t.radius.lg};
  font-size: 13px;
  font-weight: 500;
  color: ${t.color.textSoft};
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: ${t.color.accent};
    color: ${t.color.text};
    background: ${t.color.surface};
  }
`;
