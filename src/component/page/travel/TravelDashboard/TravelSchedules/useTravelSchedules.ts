import React, { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAddTravelSchedule,
  useDeleteTravelSchedule,
  useUpdateTravelSchedule,
} from "../../../../../hooks/useTravelQueries";
import {
  SchedulePlace,
  TravelResponse,
  TravelScheduleRequest,
} from "../../../../../types/travel/travelTypes";
import { PlaceItem } from "../../../../../types/place/placeTypes";
import {
  addDays,
  formatDayDate,
  fromPlaceItem,
  getTodayDayNumber,
  getTripDayCount,
  newItemId,
  parseLocalDate,
  scheduleForDay,
  toIsoDate,
} from "./scheduleUtils";

export interface ScheduleDay {
  number: number;
  date?: { date: string; weekday: string };
  count: number;
}

interface DayChange {
  day: number;
  places: SchedulePlace[];
}

/**
 * Triple 식 하루 단위 일정 — dayNumber 당 TravelSchedule 하나, places 순서 = 방문 순서.
 * 편집은 로컬(overrides)에 즉시 반영하고 저장은 직렬 큐로 보낸다.
 * (같은 여행 문서를 동시에 PUT 하면 lost update — 직전 저장 결과의 일정 id 를 다음 요청이 써야 함)
 */
export function useTravelSchedules(travel: TravelResponse) {
  const travelId = travel.id;
  const queryClient = useQueryClient();
  const addSchedule = useAddTravelSchedule();
  const updateSchedule = useUpdateTravelSchedule();
  const deleteSchedule = useDeleteTravelSchedule();

  const startDate = parseLocalDate(travel.startDate);
  const tripDays = getTripDayCount(travel.startDate, travel.endDate);

  // 날짜 미정 여행에서 "+ Day" 로 늘린 일수 (빈 날은 저장되지 않음)
  const [localDayCount, setLocalDayCount] = useState(0);
  const maxScheduledDay = Math.max(
    0,
    ...(travel.schedules ?? []).map((s) => s.dayNumber ?? 1)
  );
  const dayCount = Math.max(tripDays ?? 1, maxScheduledDay, localDayCount);

  const [selectedDay, setSelectedDay] = useState(
    () => getTodayDayNumber(travel.startDate, tripDays) ?? 1
  );
  const day = Math.min(selectedDay, dayCount);

  const [overrides, setOverrides] = useState<Record<number, SchedulePlace[]>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingRef = useRef(0);
  const chainRef = useRef<Promise<void>>(Promise.resolve());

  const itemsOf = (d: number): SchedulePlace[] =>
    overrides[d] ?? scheduleForDay(travel.schedules, d)?.places ?? [];

  const dateOf = (d: number): Date | null => (startDate ? addDays(startDate, d - 1) : null);

  const days: ScheduleDay[] = Array.from({ length: dayCount }, (_, i) => {
    const n = i + 1;
    const date = dateOf(n);
    return {
      number: n,
      date: date ? formatDayDate(date) : undefined,
      count: itemsOf(n).length,
    };
  });

  const persistDay = async ({ day: d, places }: DayChange) => {
    // 직전 저장 결과(캐시)를 기준으로 생성/수정/삭제 결정
    const latest = queryClient.getQueryData<TravelResponse>(["travel", travelId]);
    const existing = scheduleForDay(latest?.schedules, d);

    if (places.length === 0) {
      if (existing?.id) {
        await deleteSchedule.mutateAsync({ travelId, scheduleId: existing.id });
      }
      return;
    }

    const date = dateOf(d);
    const reqBody: TravelScheduleRequest = {
      title: existing?.title || `Day ${d}`,
      dayNumber: d,
      date: date ? toIsoDate(date) : undefined,
      places,
      sortOrder: d,
    };
    if (existing?.id) {
      await updateSchedule.mutateAsync({ travelId, scheduleId: existing.id, reqBody });
    } else {
      await addSchedule.mutateAsync({ travelId, reqBody });
    }
  };

  // changes 는 배열 순서대로 저장 — 날 이동은 도착 날을 먼저 (중간 실패 시 유실 대신 중복)
  const commit = (changes: DayChange[]) => {
    setError(null);
    setOverrides((prev) => {
      const next = { ...prev };
      changes.forEach((c) => (next[c.day] = c.places));
      return next;
    });
    setSaving(true);
    pendingRef.current += 1;
    chainRef.current = chainRef.current
      .then(async () => {
        for (const change of changes) await persistDay(change);
      })
      .catch(() => setError("Couldn't save your schedule. Please try again."))
      .finally(() => {
        pendingRef.current -= 1;
        // 큐가 비면 서버(캐시) 상태가 곧 진실 — 실패했다면 이 시점에 원래대로 돌아간다
        if (pendingRef.current === 0) {
          setOverrides({});
          setSaving(false);
        }
      });
  };

  const addPlace = (d: number, place: PlaceItem) =>
    commit([{ day: d, places: [...itemsOf(d), fromPlaceItem(place)] }]);

  const addCustom = (d: number, item: SchedulePlace) =>
    commit([{ day: d, places: [...itemsOf(d), { ...item, id: newItemId() }] }]);

  const updateItem = (d: number, index: number, patch: Partial<SchedulePlace>) =>
    commit([
      { day: d, places: itemsOf(d).map((it, i) => (i === index ? { ...it, ...patch } : it)) },
    ]);

  const removeItem = (d: number, index: number) =>
    commit([{ day: d, places: itemsOf(d).filter((_, i) => i !== index) }]);

  const reorder = (d: number, places: SchedulePlace[]) => commit([{ day: d, places }]);

  // 다른 날로 이동 (도착 날의 맨 뒤) — 수정 사항(patch)도 함께 반영
  const moveItem = (
    fromDay: number,
    index: number,
    toDay: number,
    patch: Partial<SchedulePlace> = {}
  ) => {
    const source = itemsOf(fromDay);
    const moved = source[index];
    if (!moved || fromDay === toDay) return;
    commit([
      { day: toDay, places: [...itemsOf(toDay), { ...moved, ...patch }] },
      { day: fromDay, places: source.filter((_, i) => i !== index) },
    ]);
  };

  const addDay = () => {
    const next = dayCount + 1;
    setLocalDayCount(next);
    setSelectedDay(next);
  };

  return {
    days,
    day,
    selectDay: setSelectedDay,
    items: itemsOf(day),
    hasTripDates: tripDays != null,
    saving,
    error,
    addPlace,
    addCustom,
    updateItem,
    removeItem,
    reorder,
    moveItem,
    addDay,
  };
}

/**
 * 포인터 기반 드래그 재정렬 (핸들에서 시작, 포인터 y 가 항목 중앙을 넘으면 교환).
 * 드래그 중엔 로컬 순서만 바꾸고, 드롭 시 순서가 바뀌었으면 onDrop 한 번 호출.
 * TravelCourse 의 코스 정렬과 같은 방식 (터치 대응 위해 핸들에 touch-action: none 필요).
 */
export function useDragReorder<T>(items: T[], onDrop: (next: T[]) => void) {
  const listRef = useRef<HTMLDivElement>(null);
  const [dragItems, setDragItems] = useState<T[] | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const stateRef = useRef<{ items: T[]; index: number } | null>(null);

  const startDrag = (index: number, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const initial = items;
    stateRef.current = { items: [...items], index };
    setDragItems(stateRef.current.items);
    setDragIndex(index);

    const onMove = (ev: PointerEvent) => {
      const st = stateRef.current;
      const listEl = listRef.current;
      if (!st || !listEl) return;
      const els = Array.from(listEl.querySelectorAll<HTMLElement>("[data-schedule-item]"));
      let target = st.index;
      els.forEach((el, i) => {
        if (i === st.index) return;
        const r = el.getBoundingClientRect();
        const mid = r.top + r.height / 2;
        if (i < st.index && ev.clientY < mid) target = Math.min(target, i);
        if (i > st.index && ev.clientY > mid) target = Math.max(target, i);
      });
      if (target !== st.index) {
        const next = [...st.items];
        const [moved] = next.splice(st.index, 1);
        next.splice(target, 0, moved);
        stateRef.current = { items: next, index: target };
        setDragItems(next);
        setDragIndex(target);
      }
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      const st = stateRef.current;
      stateRef.current = null;
      setDragItems(null);
      setDragIndex(null);
      if (st && st.items.some((it, i) => it !== initial[i])) onDrop(st.items);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  return { listRef, displayItems: dragItems ?? items, dragIndex, startDrag };
}
