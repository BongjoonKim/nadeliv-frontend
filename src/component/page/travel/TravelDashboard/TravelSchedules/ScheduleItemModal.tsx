import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { Trash2, X } from "lucide-react";
import { homeTokens } from "../../../MainPage/MainBody/homeTokens";
import { profileTokens } from "../../../profile/profileUi";
import { SchedulePlace } from "../../../../../types/travel/travelTypes";
import { ScheduleDay } from "./useTravelSchedules";
import { placeMetaLine } from "./scheduleUtils";

const t = homeTokens;
const c = profileTokens;

const MEMO_MAX = 500;

export interface ScheduleItemValues {
  name: string;
  time?: string;
  memo?: string;
  day: number;
}

interface ScheduleItemModalProps {
  /** create = 장소 없이 직접 입력하는 일정, edit = 기존 항목 */
  mode: "create" | "edit";
  item?: SchedulePlace;
  day: number;
  days: ScheduleDay[];
  onClose: () => void;
  onSave: (values: ScheduleItemValues) => void;
  onRemove?: () => void;
}

/**
 * 일정 항목 편집 — 시각·메모(예약번호, 할 일 등)·다른 날로 이동·삭제.
 * 검색으로 추가한 장소는 이름 고정, 직접 입력 항목만 이름 수정 가능.
 * 열 때만 마운트해 입력값을 한 번만 초기화 (저장 완료로 item 객체가 바뀌어도 입력 유지).
 * transform 조상이 position:fixed 를 깨뜨리므로 document.body 로 portal.
 */
const ScheduleItemModal: React.FC<ScheduleItemModalProps> = ({
  mode,
  item,
  day,
  days,
  onClose,
  onSave,
  onRemove,
}) => {
  const [name, setName] = useState(item?.name ?? "");
  const [time, setTime] = useState(item?.time ?? "");
  const [memo, setMemo] = useState(item?.memo ?? "");
  const [targetDay, setTargetDay] = useState(day);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isPlace = !!item?.placeId || (item?.lat != null && item?.lng != null);
  const canSave = name.trim().length > 0;

  const submit = () => {
    if (!canSave) return;
    onSave({
      name: name.trim(),
      time: time || undefined,
      memo: memo.trim() || undefined,
      day: targetDay,
    });
  };

  const meta = item ? placeMetaLine(item) : "";

  return createPortal(
    <Overlay onClick={onClose}>
      <Panel onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <PanelHeader>
          <div>
            <PanelEyebrow>Day {day}</PanelEyebrow>
            <PanelTitle>{mode === "create" ? "Add a plan" : isPlace ? item?.name : "Edit plan"}</PanelTitle>
            {mode === "edit" && isPlace && meta && <PanelMeta>{meta}</PanelMeta>}
          </div>
          <CloseButton onClick={onClose} aria-label="Close">
            <X size={16} />
          </CloseButton>
        </PanelHeader>

        {!isPlace && (
          <Field>
            <Label htmlFor="schedule-item-name">Title</Label>
            <Input
              id="schedule-item-name"
              autoFocus
              value={name}
              maxLength={100}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="e.g. Check in, KTX to Busan, Free time"
            />
          </Field>
        )}

        <Row>
          <Field>
            <Label htmlFor="schedule-item-time">Time</Label>
            <TimeWrap>
              <Input
                id="schedule-item-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
              {time && (
                <ClearButton onClick={() => setTime("")} aria-label="Clear time">
                  <X size={13} />
                </ClearButton>
              )}
            </TimeWrap>
          </Field>

          {mode === "edit" && days.length > 1 && (
            <Field>
              <Label htmlFor="schedule-item-day">Day</Label>
              <Select
                id="schedule-item-day"
                value={targetDay}
                onChange={(e) => setTargetDay(Number(e.target.value))}
              >
                {days.map((d) => (
                  <option key={d.number} value={d.number}>
                    Day {d.number}
                    {d.date ? ` · ${d.date.date} ${d.date.weekday}` : ""}
                  </option>
                ))}
              </Select>
            </Field>
          )}
        </Row>

        <Field>
          <Label htmlFor="schedule-item-memo">Memo</Label>
          <Textarea
            id="schedule-item-memo"
            rows={3}
            value={memo}
            maxLength={MEMO_MAX}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="Reservation number, what to order, meeting point…"
          />
        </Field>

        <Footer>
          {mode === "edit" && onRemove ? (
            <RemoveButton onClick={onRemove}>
              <Trash2 size={13} />
              Remove
            </RemoveButton>
          ) : (
            <span />
          )}
          <FooterRight>
            <GhostButton onClick={onClose}>Cancel</GhostButton>
            <SaveButton onClick={submit} disabled={!canSave}>
              {mode === "create" ? "Add" : "Save"}
            </SaveButton>
          </FooterRight>
        </Footer>
      </Panel>
    </Overlay>,
    document.body
  );
};

export default ScheduleItemModal;

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
  max-width: 440px;
  max-height: 88vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background: ${t.color.surface};
  border: 1px solid ${t.color.border};
  border-radius: ${t.radius.lg};
  font-family: ${t.font.sans};
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;

  > div {
    min-width: 0;
  }
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
  word-break: keep-all;
`;

const PanelMeta = styled.p`
  margin: 4px 0 0;
  font-size: 12.5px;
  color: ${t.color.textMuted};
`;

const CloseButton = styled.button`
  display: flex;
  flex-shrink: 0;
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

const Row = styled.div`
  display: flex;
  gap: 12px;

  > * {
    flex: 1;
    min-width: 0;
  }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 11.5px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${t.color.textMuted};
`;

const inputStyles = `
  width: 100%;
  padding: 10px 12px;
  background: ${c.inputBg};
  border: 1px solid ${c.inputBorder};
  border-radius: ${t.radius.md};
  font-family: ${t.font.sans};
  font-size: 13.5px;
  color: ${t.color.text};
  outline: none;
  color-scheme: dark;

  &::placeholder {
    color: ${t.color.textFaint};
  }

  &:focus {
    border-color: ${t.color.accent};
  }
`;

const Input = styled.input`
  ${inputStyles}
`;

const Select = styled.select`
  ${inputStyles}
  cursor: pointer;
`;

const Textarea = styled.textarea`
  ${inputStyles}
  resize: vertical;
  min-height: 72px;
  line-height: 1.5;
`;

const TimeWrap = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const ClearButton = styled.button`
  position: absolute;
  right: 36px;
  display: flex;
  padding: 3px;
  background: none;
  border: none;
  color: ${t.color.textMuted};
  cursor: pointer;

  &:hover {
    color: ${t.color.text};
  }
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const FooterRight = styled.div`
  display: flex;
  gap: 8px;
`;

const RemoveButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 12px;
  background: none;
  border: 1px solid ${c.dangerBorder};
  border-radius: ${t.radius.md};
  font-size: 13px;
  color: ${c.danger};
  cursor: pointer;

  &:hover {
    background: ${c.dangerSurface};
  }
`;

const GhostButton = styled.button`
  padding: 9px 16px;
  background: none;
  border: 1px solid ${t.color.border2};
  border-radius: ${t.radius.md};
  font-size: 13px;
  color: ${t.color.textSoft};
  cursor: pointer;

  &:hover {
    color: ${t.color.text};
  }
`;

const SaveButton = styled.button`
  padding: 9px 18px;
  background: ${t.color.accentStrong};
  border: none;
  border-radius: ${t.radius.md};
  font-size: 13px;
  font-weight: 600;
  color: ${t.color.text};
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${t.color.accent};
    color: ${t.color.bg};
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;
