import useAuthEP from "../utils/useAuthEP";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  TravelResponse,
  TravelListResponse,
  TravelCreateRequest,
  TravelUpdateRequest,
  TravelMemberRequest,
  TravelRegionsRequest,
  TravelPlacesRequest,
  TravelRole,
  TravelMedia,
  TravelMediaSort,
  TravelMediaType,
  TravelScheduleRequest,
} from "../types/travel/travelTypes";
import {
  createTravel,
  getTravel,
  getMyTravels,
  updateTravel,
  updateTravelRegions,
  updateTravelPlaces,
  deleteTravel,
  addTravelMember,
  removeTravelMember,
  updateMemberRole,
  addTravelSchedule,
  updateTravelSchedule,
  deleteTravelSchedule,
  getTravelMedia,
  getTravelMediaCount,
  deleteTravelMedia,
  getTravelMediaDownloadUrl,
  createTravelMediaDownloadTicket,
} from "../endpoints/travel-endpoints";

// 내 여행 목록 조회
export const useGetMyTravels = (page = 0, size = 10) => {
  const authEP = useAuthEP();

  return useQuery<TravelListResponse>({
    queryKey: ["myTravels", page, size],
    queryFn: async () => {
      const response = await authEP({
        func: getMyTravels,
        params: { page, size },
      });
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });
};

// 여행 상세 조회
export const useGetTravel = (travelId?: string) => {
  const authEP = useAuthEP();

  return useQuery<TravelResponse>({
    queryKey: ["travel", travelId],
    queryFn: async () => {
      if (!travelId) throw new Error("travelId is required");
      const response = await authEP({
        func: getTravel,
        params: { travelId },
      });
      return response.data;
    },
    enabled: !!travelId,
    staleTime: 1000 * 60 * 5,
  });
};

// 여행 생성
export const useCreateTravel = () => {
  const authEP = useAuthEP();
  const queryClient = useQueryClient();

  return useMutation<TravelResponse, Error, TravelCreateRequest>({
    mutationFn: async (reqBody) => {
      const response = await authEP({
        func: createTravel,
        reqBody,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myTravels"] });
    },
  });
};

// 여행 수정
export const useUpdateTravel = () => {
  const authEP = useAuthEP();
  const queryClient = useQueryClient();

  return useMutation<
    TravelResponse,
    Error,
    { travelId: string; reqBody: TravelUpdateRequest }
  >({
    mutationFn: async ({ travelId, reqBody }) => {
      const response = await authEP({
        func: updateTravel,
        params: { travelId },
        reqBody,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["travel", data.id] });
      queryClient.invalidateQueries({ queryKey: ["myTravels"] });
    },
  });
};

// 방문 지역(시/군) 갱신 — Korea Map 플러그인
export const useUpdateTravelRegions = () => {
  const authEP = useAuthEP();
  const queryClient = useQueryClient();

  return useMutation<
    TravelResponse,
    Error,
    { travelId: string; reqBody: TravelRegionsRequest }
  >({
    mutationFn: async ({ travelId, reqBody }) => {
      const response = await authEP({
        func: updateTravelRegions,
        params: { travelId },
        reqBody,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["travel", data.id] });
      queryClient.invalidateQueries({ queryKey: ["myTravels"] });
    },
  });
};

// 다녀온 장소 목록 갱신 (Korea Map 플러그인)
export const useUpdateTravelPlaces = () => {
  const authEP = useAuthEP();
  const queryClient = useQueryClient();

  return useMutation<
    TravelResponse,
    Error,
    { travelId: string; reqBody: TravelPlacesRequest }
  >({
    mutationFn: async ({ travelId, reqBody }) => {
      const response = await authEP({
        func: updateTravelPlaces,
        params: { travelId },
        reqBody,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["travel", data.id] });
      queryClient.invalidateQueries({ queryKey: ["myTravels"] });
    },
  });
};

// 여행 삭제
export const useDeleteTravel = () => {
  const authEP = useAuthEP();
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (travelId) => {
      await authEP({
        func: deleteTravel,
        params: { travelId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myTravels"] });
    },
  });
};

// 멤버 추가
export const useAddTravelMember = () => {
  const authEP = useAuthEP();
  const queryClient = useQueryClient();

  return useMutation<
    TravelResponse,
    Error,
    { travelId: string; reqBody: TravelMemberRequest }
  >({
    mutationFn: async ({ travelId, reqBody }) => {
      const response = await authEP({
        func: addTravelMember,
        params: { travelId },
        reqBody,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["travel", data.id] });
    },
  });
};

// 멤버 삭제
export const useRemoveTravelMember = () => {
  const authEP = useAuthEP();
  const queryClient = useQueryClient();

  return useMutation<void, Error, { travelId: string; userId: string }>({
    mutationFn: async ({ travelId, userId }) => {
      await authEP({
        func: removeTravelMember,
        params: { travelId, userId },
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["travel", variables.travelId],
      });
    },
  });
};

// 멤버 역할 변경
export const useUpdateMemberRole = () => {
  const authEP = useAuthEP();
  const queryClient = useQueryClient();

  return useMutation<
    TravelResponse,
    Error,
    { travelId: string; userId: string; role: TravelRole }
  >({
    mutationFn: async ({ travelId, userId, role }) => {
      const response = await authEP({
        func: updateMemberRole,
        params: { travelId, userId, role },
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["travel", data.id] });
    },
  });
};

/* ── 일정(Schedules) ──
 * 응답이 갱신된 여행 전체이므로 refetch 대신 캐시에 바로 반영한다.
 * (연속 저장 시 다음 요청이 방금 생성된 일정 id 를 즉시 읽을 수 있어야 함) */

// 일정 추가
export const useAddTravelSchedule = () => {
  const authEP = useAuthEP();
  const queryClient = useQueryClient();

  return useMutation<
    TravelResponse,
    Error,
    { travelId: string; reqBody: TravelScheduleRequest }
  >({
    mutationFn: async ({ travelId, reqBody }) => {
      const response = await authEP({
        func: addTravelSchedule,
        params: { travelId },
        reqBody,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["travel", data.id], data);
      queryClient.invalidateQueries({ queryKey: ["myTravels"] });
    },
  });
};

// 일정 수정
export const useUpdateTravelSchedule = () => {
  const authEP = useAuthEP();
  const queryClient = useQueryClient();

  return useMutation<
    TravelResponse,
    Error,
    { travelId: string; scheduleId: string; reqBody: TravelScheduleRequest }
  >({
    mutationFn: async ({ travelId, scheduleId, reqBody }) => {
      const response = await authEP({
        func: updateTravelSchedule,
        params: { travelId, scheduleId },
        reqBody,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["travel", data.id], data);
      queryClient.invalidateQueries({ queryKey: ["myTravels"] });
    },
  });
};

// 일정 삭제 (204 — 응답 본문 없음)
export const useDeleteTravelSchedule = () => {
  const authEP = useAuthEP();
  const queryClient = useQueryClient();

  return useMutation<void, Error, { travelId: string; scheduleId: string }>({
    mutationFn: async ({ travelId, scheduleId }) => {
      await authEP({
        func: deleteTravelSchedule,
        params: { travelId, scheduleId },
      });
    },
    onSuccess: (_, { travelId, scheduleId }) => {
      queryClient.setQueryData<TravelResponse>(["travel", travelId], (old) =>
        old
          ? { ...old, schedules: old.schedules?.filter((s) => s.id !== scheduleId) }
          : old
      );
      queryClient.invalidateQueries({ queryKey: ["myTravels"] });
    },
  });
};

// 미디어 목록 조회 (단일 페이지 — 대시보드 미리보기 스트립 등 소량 조회용)
export const useGetTravelMedia = (travelId?: string, page = 0, size = 50) => {
  const authEP = useAuthEP();

  return useQuery<TravelMedia[]>({
    queryKey: ["travelMedia", travelId, page, size],
    queryFn: async () => {
      if (!travelId) throw new Error("travelId is required");
      const response = await authEP({
        func: getTravelMedia,
        params: { travelId, page, size },
      });
      return response.data;
    },
    enabled: !!travelId,
    staleTime: 1000 * 60 * 3,
  });
};

export const TRAVEL_MEDIA_PAGE_SIZE = 60;

// 미디어 목록 무한 스크롤 (앨범 전용 화면). 마지막 페이지 판정 = 받은 개수 < size
export const useGetTravelMediaInfinite = (
  travelId?: string,
  options: { sort?: TravelMediaSort; type?: TravelMediaType; size?: number } = {}
) => {
  const authEP = useAuthEP();
  const sort: TravelMediaSort = options.sort ?? "created_desc";
  const type: TravelMediaType = options.type ?? "all";
  const size = options.size ?? TRAVEL_MEDIA_PAGE_SIZE;

  return useInfiniteQuery<TravelMedia[], Error>({
    queryKey: ["travelMedia", travelId, "infinite", sort, type, size],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      if (!travelId) throw new Error("travelId is required");
      const response = await authEP({
        func: getTravelMedia,
        params: { travelId, page: pageParam as number, size, sort, type },
      });
      return response.data;
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < size ? undefined : allPages.length,
    enabled: !!travelId,
    staleTime: 1000 * 60 * 3,
  });
};

// 미디어 개수 (대시보드 Album 박스·앨범 헤더 탭 카운트)
export const useGetTravelMediaCount = (
  travelId?: string,
  type: TravelMediaType = "all"
) => {
  const authEP = useAuthEP();

  return useQuery<number>({
    queryKey: ["travelMediaCount", travelId, type],
    queryFn: async () => {
      if (!travelId) throw new Error("travelId is required");
      const response = await authEP({
        func: getTravelMediaCount,
        params: { travelId, type },
      });
      return response.data.count ?? 0;
    },
    enabled: !!travelId,
    staleTime: 1000 * 60 * 3,
  });
};

// 미디어 업로드는 presigned 직접 업로드 — hooks/useTravelMediaUpload.ts 참조

// 미디어 삭제
export const useDeleteTravelMedia = () => {
  const authEP = useAuthEP();
  const queryClient = useQueryClient();

  return useMutation<void, Error, { travelId: string; mediaId: string }>({
    mutationFn: async ({ travelId, mediaId }) => {
      await authEP({
        func: deleteTravelMedia,
        params: { travelId, mediaId },
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["travelMedia", variables.travelId],
      });
      queryClient.invalidateQueries({
        queryKey: ["travelMediaCount", variables.travelId],
      });
    },
  });
};

// 미디어 다운로드
/** 브라우저가 URL 로 바로 이동해 받게 한다 — blob 으로 메모리에 담지 않으므로 GB 단위도 디스크로 바로 간다 */
const triggerBrowserDownload = (href: string, fileName?: string) => {
  const a = document.createElement("a");
  a.href = href;
  // cross-origin 이라 download 속성은 무시되지만, 서버가 Content-Disposition: attachment 를 내려 저장 대화상자가 뜬다
  if (fileName) a.download = fileName;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
};

const absoluteBackendUrl = (path: string) => {
  const base = `${process.env["REACT_APP_BACKEND_URI"] ?? ""}`;
  return new URL(path, base.endsWith("/") ? base : `${base}/`).toString();
};

export const useDownloadTravelMedia = () => {
  const authEP = useAuthEP();

  // 단일: S3 presigned GET URL (원본 파일명으로 저장되도록 서명에 Content-Disposition 포함)
  const downloadSingle = async (
    travelId: string,
    mediaId: string,
    fileName: string
  ) => {
    const response = await authEP({
      func: getTravelMediaDownloadUrl,
      params: { travelId, mediaId },
    });
    triggerBrowserDownload(response.data.url, response.data.fileName || fileName);
  };

  // 일괄: 티켓 발급 → 비인증 GET 으로 ZIP 스트리밍
  const downloadBatch = async (travelId: string, mediaIds: string[]) => {
    const response = await authEP({
      func: createTravelMediaDownloadTicket,
      params: { travelId },
      reqBody: { mediaIds },
    });
    triggerBrowserDownload(absoluteBackendUrl(response.data.path), response.data.fileName);
  };

  return { downloadSingle, downloadBatch };
};
