// Travel Enums
export type TravelVisibility = "PUBLIC" | "PRIVATE";
export type TravelStatus = "PLANNING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type TravelRole = "ADMIN" | "USER" | "VIEWER";

// Embedded Models
// 하루 코스의 한 항목 (Triple 식). 좌표가 없으면 직접 입력한 일정(메모)
export interface SchedulePlace {
  /** 항목 식별자 (프론트 생성 — 정렬·이동 시 동일 항목 추적) */
  id?: string;
  /** 검색 제공자(카카오) 장소 ID */
  placeId?: string;
  name?: string;
  nameEn?: string;
  category?: string;
  categoryEn?: string;
  address?: string;
  lat?: number;
  lng?: number;
  /** 방문 예정 시각 "HH:mm" */
  time?: string;
  memo?: string;
}

// 여행 일정 — dayNumber 당 하나 (places 순서 = 그날 방문 순서)
export interface TravelSchedule {
  id?: string;
  dayNumber?: number;
  date?: string;
  title: string;
  description?: string;
  places?: SchedulePlace[];
  sortOrder?: number;
}

// 다녀온 장소 (Korea Map 플러그인 — 순서·시간 미기록)
export interface VisitedPlace {
  /** 검색 제공자(카카오) 장소 ID — 중복 방지 키 */
  id?: string;
  name: string;
  nameEn?: string;
  category?: string;
  categoryEn?: string;
  address?: string;
  lat?: number;
  lng?: number;
  /** 이 장소가 속한 시/군 행정코드 (좌표→지역 매칭 결과) */
  regionCode?: string;
  /** 이전 장소 → 이 장소 이동 수단 (코스 타임라인, 수동 입력) */
  transportMode?: TransportMode;
  /** 이전 장소 → 이 장소 소요 시간(분) */
  durationMinutes?: number;
}

// 구글 타임라인의 다양한 활동 유형을 커버하는 이동 수단 목록.
// TRANSIT 은 초기 구현의 레거시 값 (기존 저장 데이터 호환용 — UI 신규 선택지에는 미노출)
export type TransportMode =
  | "WALK"
  | "BICYCLE"
  | "CAR"
  | "BUS"
  | "SUBWAY"
  | "TRAIN"
  | "TRAM"
  | "FERRY"
  | "FLIGHT"
  | "TRANSIT";

// Member Response (nested in TravelResponse)
export interface TravelMemberResponse {
  userId: string;
  role: string;
  nickname?: string;
  joinedAt?: string;
}

// 대시보드 표시 항목 (배열 순서 = 표시 순서)
export type DashboardDisplay = "stat" | "row";

export interface TravelDashboardItem {
  key: string; // travelDashboardItems.ts 위젯 레지스트리의 키
  display: DashboardDisplay; // stat = 작은 박스, row = 전체 행 섹션
  visible: boolean;
}

// Main Travel Response
export interface TravelResponse {
  id: string;
  title: string;
  description?: string;
  coverImageUrl?: string;
  visibility: TravelVisibility;
  status: TravelStatus;
  startDate?: string;
  endDate?: string;
  destination?: string;
  tags?: string[];
  schedules?: TravelSchedule[];
  channelIds?: string[];
  visitedRegionCodes?: string[];
  visitedPlaces?: VisitedPlace[];
  dashboardItems?: TravelDashboardItem[];
  members?: TravelMemberResponse[];
  memberCount?: number;
  createdUser?: string;
  created?: string;
  updated?: string;
}

// List Response with Pagination
export interface TravelListResponse {
  travels: TravelResponse[];
  pagination: {
    totalCount: number;
    pageSize: number;
    currentPage: number;
    hasMore: boolean;
  };
}

// Request DTOs
export interface TravelCreateRequest {
  title: string;
  description?: string;
  coverImageUrl?: string;
  visibility?: TravelVisibility;
  startDate?: string;
  endDate?: string;
  destination?: string;
  tags?: string[];
  dashboardItems?: TravelDashboardItem[];
}

export interface TravelUpdateRequest {
  title?: string;
  description?: string;
  coverImageUrl?: string;
  visibility?: TravelVisibility;
  status?: TravelStatus;
  startDate?: string;
  endDate?: string;
  destination?: string;
  tags?: string[];
  dashboardItems?: TravelDashboardItem[];
}

export interface TravelMemberRequest {
  userId: string;
  role?: TravelRole;
  nickname?: string;
}

// 방문 지역(시/군) 갱신 요청 — Korea Map 플러그인
export interface TravelRegionsRequest {
  regionCodes: string[];
}

// 다녀온 장소 갱신 요청 (전체 교체 방식)
export interface TravelPlacesRequest {
  places: VisitedPlace[];
}

export interface TravelScheduleRequest {
  title: string;
  dayNumber?: number;
  date?: string;
  description?: string;
  places?: SchedulePlace[];
  sortOrder?: number;
}

// Media
export type TravelMediaSort =
  | "created_desc"
  | "created_asc"
  | "taken_desc"
  | "taken_asc";
export type TravelMediaType = "all" | "image" | "video";

export interface TravelMediaCountResponse {
  count: number;
}

export interface TravelMedia {
  id: string;
  travelId: string;
  uploadUserId: string;
  fileName: string;
  originalFileName: string;
  fileUrl: string;
  thumbnailUrl?: string;
  mimeType: string;
  fileSize: number;
  width?: number;
  height?: number;
  duration?: number;
  description?: string;
  takenAt?: string;
  created?: string;
}
