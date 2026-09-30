import { homeTokens } from "../../../MainPage/MainBody/homeTokens";
import {
  SchedulePlace,
  TravelSchedule,
} from "../../../../../types/travel/travelTypes";
import { PlaceItem } from "../../../../../types/place/placeTypes";
import { locateRegion } from "../../../../../utils/koreaRegionLocator";

/* ── 날짜 ── */

// 비정상적으로 긴 기간(날짜 오입력)에 탭이 폭주하지 않도록 상한
const MAX_TRIP_DAYS = 60;
const DAY_MS = 24 * 60 * 60 * 1000;

/** "YYYY-MM-DD" → 로컬 자정. new Date("YYYY-MM-DD") 는 UTC 로 해석돼 서쪽 시간대에서 하루 밀린다. */
export function parseLocalDate(iso?: string): Date | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function toIsoDate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** 여행 기간 일수 (시작·종료일 둘 다 있을 때만) */
export function getTripDayCount(start?: string, end?: string): number | null {
  const s = parseLocalDate(start);
  const e = parseLocalDate(end);
  if (!s || !e || e < s) return null;
  // DST 로 하루가 23/25시간일 수 있어 round
  const days = Math.round((e.getTime() - s.getTime()) / DAY_MS) + 1;
  return Math.min(days, MAX_TRIP_DAYS);
}

/** 오늘이 여행 기간 중이면 몇 번째 날인지 */
export function getTodayDayNumber(start?: string, dayCount?: number | null): number | null {
  const s = parseLocalDate(start);
  if (!s || !dayCount) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const n = Math.round((today.getTime() - s.getTime()) / DAY_MS) + 1;
  return n >= 1 && n <= dayCount ? n : null;
}

/** 예: "Oct 3", "Fri" */
export function formatDayDate(d: Date): { date: string; weekday: string } {
  return {
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
  };
}

/* ── 거리 (직선 거리, 경로 API 미연동) ── */

export function distanceMeters(a: SchedulePlace, b: SchedulePlace): number | null {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return null;
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)}m`;
  const km = m / 1000;
  return km < 100 ? `${km.toFixed(1)}km` : `${Math.round(km)}km`;
}

/** 하루 코스 총 이동 거리 (연속한 좌표 항목 사이 합) */
export function totalDistance(items: SchedulePlace[]): number {
  let sum = 0;
  for (let i = 1; i < items.length; i++) {
    sum += distanceMeters(items[i - 1], items[i]) ?? 0;
  }
  return sum;
}

/* ── 카테고리 (카카오 category_group_name 기준) ── */

export type ScheduleCategoryKind = keyof typeof homeTokens.scheduleCategory;

export function categoryKind(p: SchedulePlace): ScheduleCategoryKind {
  const c = p.category ?? "";
  if (c.includes("숙박")) return "stay";
  if (c.includes("음식점") || c.includes("카페")) return "food";
  if (c.includes("지하철") || c.includes("주차장") || c.includes("주유소")) return "transport";
  if (c.includes("관광") || c.includes("문화시설")) return "sight";
  return "other";
}

export function categoryColor(p: SchedulePlace): string {
  return homeTokens.scheduleCategory[categoryKind(p)];
}

// 카카오 category_group_name 은 고정 목록 — 기계 번역(categoryEn) 대신 직접 매핑.
// 검색 API 의 배치 번역이 빈 카테고리에서 한 칸씩 밀려 categoryEn 이 다른 장소 이름이 되는 경우가 있음.
const KAKAO_CATEGORY_EN: Record<string, string> = {
  숙박: "Accommodation",
  음식점: "Restaurant",
  카페: "Cafe",
  관광명소: "Attraction",
  문화시설: "Culture",
  지하철역: "Subway station",
  주차장: "Parking",
  "주유소,충전소": "Gas station",
  대형마트: "Supermarket",
  편의점: "Convenience store",
  은행: "Bank",
  병원: "Hospital",
  약국: "Pharmacy",
  공공기관: "Public office",
};

function categoryLabel(p: SchedulePlace): string | undefined {
  if (!p.category) return undefined; // 한글 카테고리가 없으면 categoryEn 도 신뢰 불가
  return KAKAO_CATEGORY_EN[p.category] ?? (p.categoryEn || p.category);
}

/** 카드 보조 줄: "Restaurant · Busan" (직접 입력 항목은 빈 문자열) */
export function placeMetaLine(p: SchedulePlace): string {
  const category = categoryLabel(p);
  const area =
    p.lat != null && p.lng != null ? locateRegion(p.lat, p.lng)?.nameEn : undefined;
  return [category, area].filter(Boolean).join(" · ");
}

/* ── 항목 ── */

export function newItemId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function fromPlaceItem(p: PlaceItem): SchedulePlace {
  return {
    id: newItemId(),
    placeId: p.id,
    name: p.name,
    nameEn: p.nameEn,
    category: p.category,
    categoryEn: p.categoryEn,
    address: p.roadAddressKo || p.addressKo,
    lat: p.lat,
    lng: p.lng,
  };
}

/** dayNumber 가 없는 (구버전) 일정은 Day 1 로 취급 */
export function scheduleForDay(
  schedules: TravelSchedule[] | undefined,
  day: number
): TravelSchedule | undefined {
  return schedules?.find((s) => (s.dayNumber ?? 1) === day);
}

export function countScheduleItems(schedules?: TravelSchedule[]): number {
  return schedules?.reduce((n, s) => n + (s.places?.length ?? 0), 0) ?? 0;
}
