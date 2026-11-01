import useAuthEP from "../utils/useAuthEP";
import {useMutation, useQueries, useQuery, useQueryClient} from "@tanstack/react-query";
import {DocumentViewResponse, IncreaseViewRequest, PopularPostDTO, ViewStatsDTO} from "../types/blog/blogTypes";
import {
  getDocumentsByAuth,
  getFollowingFeed,
  getPopularPosts,
  getViews,
  getViewStats,
  increaseView,
  restoreDocument,
} from "../endpoints/blog-endpoints";
import {ApiResponse} from "../types/messenger/messengerTypes";
import {
  DashboardTab,
  MyBlogListParams,
  MyBlogStats,
  SORT_TO_DATE_SORT,
  TAB_TO_STATUS,
} from "../types/blog/myBlogTypes";

export const useGetViews = (documentId?: string) => {
  return useQuery<DocumentViewResponse>({
    queryKey: ["views", documentId],
    queryFn: async () => {
      if (!documentId) throw new Error("documentId is required");
      const response = await getViews({ params: { documentId } });
      return response.data;
    },
    enabled: !!documentId,
    staleTime: 1000 * 60 * 5, // 5분
  });
};

// 조회수 증가 hook
export const useIncreaseView = () => {
  const queryClient = useQueryClient();
  
  return useMutation<IncreaseViewRequest, Error, string>({
    mutationFn: async (documentId: string) => {
      const response = await increaseView({params: {documentId}});
      return response.data;
    },
    onSuccess: (data, documentId) => {
      queryClient.invalidateQueries({queryKey:["views", documentId]});
      queryClient.invalidateQueries({ queryKey: ["viewStats", documentId] });
    }
  })
  
}

// 상세 조회 통계 hook
export const useGetViewStats = (documentId?: string) => {
  return useQuery<ViewStatsDTO>({
    queryKey: ["viewStats", documentId],
    queryFn: async () => {
      if (!documentId) throw new Error("documentId is required");
      const response = await getViewStats({ params: { documentId } });
      return response.data;
    },
    enabled: !!documentId,
    staleTime: 1000 * 60 * 1, // 1분 (실시간 통계용이므로 더 짧게)
  })
}

/* -------------------------------------------------------------------------- */
/*  내 블로그 대시보드 (`/blog/my`) 쿼리                                       */
/* -------------------------------------------------------------------------- */

/**
 * 백엔드의 단일 엔드포인트 `GET /blog/documents?type=...` 를 호출하는 공용 헬퍼.
 * 5개 탭 모두 동일한 엔드포인트라 endpoint 함수를 따로 두지 않는다.
 */
function useMyBlogList(params: MyBlogListParams, enabled: boolean) {
  const authEP = useAuthEP();
  const status = TAB_TO_STATUS[params.tab];
  const dateSort = SORT_TO_DATE_SORT[params.sort];

  return useQuery<DocumentsInfo>({
    queryKey: ["my-blog", params.tab, status, dateSort, params.page ?? 0, params.size ?? 20, params.folderId ?? null, params.locale ?? null],
    queryFn: async () => {
      const res = await authEP({
        func: getDocumentsByAuth,
        params: {
          type: status,
          dateSort,
          page: params.page ?? 0,
          size: params.size ?? 20,
          folderId: params.folderId,
          locale: params.locale,
        },
      });
      return res.data as DocumentsInfo;
    },
    enabled,
    staleTime: 1000 * 30,
  });
}

export const useMyBlogPosts = (params: Omit<MyBlogListParams, "tab">) =>
  useMyBlogList({ ...params, tab: "my-posts" }, true);

export const useMyBlogDrafts = (params: Omit<MyBlogListParams, "tab">) =>
  useMyBlogList({ ...params, tab: "drafts" }, true);

export const useMyBookmarks = (params: Omit<MyBlogListParams, "tab">) =>
  useMyBlogList({ ...params, tab: "bookmarks" }, true);

export const useMyBlogHidden = (params: Omit<MyBlogListParams, "tab">) =>
  useMyBlogList({ ...params, tab: "hidden" }, true);

export const useMyBlogTrash = (params: Omit<MyBlogListParams, "tab">) =>
  useMyBlogList({ ...params, tab: "trash" }, true);

/**
 * 활성 탭만 fetch 하는 헬퍼. Phase 3 에서 대시보드가 이걸 쓰면
 * 비활성 탭은 fetch 가 일어나지 않는다.
 */
export const useMyBlogListForTab = (tab: DashboardTab, params: Omit<MyBlogListParams, "tab">) =>
  useMyBlogList({ ...params, tab }, true);

/**
 * 대시보드 스탯. 현재 백엔드에 집계 엔드포인트가 없어,
 * 발행/초안/북마크 카운트는 각 리스트의 totalDocsCnt 로 합성한다.
 *
 * viewsThisWeek / viewsLastWeek 는 별도 백엔드 작업이 들어오기 전까지 0 으로 채운다.
 * 이 hook 의 형태(반환 타입)는 Phase 3 에서 위젯이 의존할 수 있도록 미리 확정해 둔다.
 */
export const useMyBlogStats = () => {
  const authEP = useAuthEP();

  const queries = useQueries({
    queries: (["my-blog", "draft", "bookmark"] as const).map((status) => ({
      queryKey: ["my-blog-stats", status],
      queryFn: async () => {
        const res = await authEP({
          func: getDocumentsByAuth,
          params: { type: status, dateSort: "DESC", page: 0, size: 1 },
        });
        return res.data as DocumentsInfo;
      },
      staleTime: 1000 * 60 * 5,
    })),
  });

  const [publishedQ, draftQ, bookmarkQ] = queries;
  const isLoading = queries.some((q) => q.isLoading);
  const isError = queries.some((q) => q.isError);

  const data: MyBlogStats = {
    viewsThisWeek: 0,
    viewsLastWeek: 0,
    publishedCount: publishedQ.data?.totalDocsCnt ?? 0,
    categoryCount: 0,
    draftCount: draftQ.data?.totalDocsCnt ?? 0,
    lastDraftEditedAt: draftQ.data?.documents?.[0]?.updated
      ? String(draftQ.data.documents[0].updated)
      : undefined,
    bookmarkCount: bookmarkQ.data?.totalDocsCnt ?? 0,
  };

  return { data, isLoading, isError };
};

// 휴지통 글 복구 (isDeleted=false 로 되돌림). 성공 시 대시보드 목록·카운트 갱신.
export const useRestoreDocument = () => {
  const authEP = useAuthEP();
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, string>({
    mutationFn: async (documentId: string) => {
      const res = await authEP({ func: restoreDocument, params: { id: documentId } });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-blog"] });
      queryClient.invalidateQueries({ queryKey: ["my-blog-stats"] });
    },
  });
};

/* -------------------------------------------------------------------------- */
/*  사이드바 위젯 / Following 피드                                              */
/* -------------------------------------------------------------------------- */

export const usePopularPosts = (period: 'day' | 'week' | 'month' | 'all' = 'month', limit: number = 3) => {
  return useQuery<PopularPostDTO[]>({
    queryKey: ['blog', 'popular', period, limit],
    queryFn: async () => {
      const res = await getPopularPosts({ params: { period, limit } });
      return res.data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
};

interface FollowingFeedParams {
  page?: number;
  size?: number;
  dateSort?: 'ASC' | 'DESC';
  locale?: string;
}

export const useFollowingFeed = (params: FollowingFeedParams, enabled: boolean) => {
  const authEP = useAuthEP();
  return useQuery<DocumentsInfo>({
    queryKey: ['following-feed', params.page ?? 0, params.size ?? 24, params.dateSort ?? 'DESC', params.locale ?? null],
    queryFn: async () => {
      const res = await authEP({
        func: getFollowingFeed,
        params: {
          page: params.page ?? 0,
          size: params.size ?? 24,
          dateSort: params.dateSort ?? 'DESC',
          locale: params.locale,
        },
      });
      return res.data as DocumentsInfo;
    },
    enabled,
    staleTime: 1000 * 30,
  });
};