import { useCallback, useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import moment from "moment";
import { useCurrentUser } from "../../../../hooks/useCurrentUser";
import {
  useMyBlogListForTab,
  useMyBlogStats,
} from "../../../../hooks/useBlogQueries";
import { useMyFolders } from "../../../../hooks/useFolderQueries";
import { getViews } from "../../../../endpoints/blog-endpoints";
import { getDocumentLikeStatus } from "../../../../endpoints/document-like-endpoints";
import {
  isDashboardTab,
  type DashboardTab,
  type DashboardSort,
} from "../../../../types/blog/myBlogTypes";

export type DashboardTabKey = DashboardTab;
export type PostStatus = "PUBLISHED" | "DRAFT";

export interface DashboardPost {
  id: string;
  thumbnail: string | null;
  title: string;
  category: string;
  date: string;
  status: PostStatus;
  views: number | null;
  likes: number | null;
  gradient: string;
  /** 휴지통 글 여부 — 행 액션 메뉴가 Restore 로 바뀐다 */
  isDeleted: boolean;
}

export interface DashboardStat {
  key: string;
  label: string;
  value: string;
  caption: string;
}

// 썸네일이 없을 때 보여줄 fallback 그라데이션. 카드별로 다양성을 주기 위해 id 해시로 선택.
const FALLBACK_GRADIENTS = [
  "linear-gradient(135deg, #c8d8c4 0%, #9fb89a 100%)",
  "linear-gradient(135deg, #d8c4a8 0%, #b89a7a 100%)",
  "linear-gradient(135deg, #c4d4e8 0%, #8aa5c4 100%)",
  "linear-gradient(135deg, #e0c8d8 0%, #b89aa8 100%)",
  "linear-gradient(135deg, #3a3a3a 0%, #1f1f1f 100%)",
];

function pickGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % FALLBACK_GRADIENTS.length;
  return FALLBACK_GRADIENTS[idx];
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

function formatDate(value?: string | Date): string {
  if (!value) return "";
  const m = moment(value);
  return m.isValid() ? m.format("YYYY-MM-DD") : "";
}

export default function useMyBlogDashboard() {
  const { data: currentUser } = useCurrentUser();

  // 옛 `/blog/{type}` URL 에서 BlogManageRedirect 가 보낸 `?tab=` 을 초기 탭으로 사용.
  // 부정한 값이 오면 기본 탭(my-posts)으로 폴백.
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const initialTab: DashboardTabKey = isDashboardTab(tabFromUrl) ? tabFromUrl : "my-posts";

  const [activeTab, setActiveTabState] = useState<DashboardTabKey>(initialTab);
  const [sortKey, setSortKey] = useState<DashboardSort>("latest");

  // 탭 변경 시 URL `?tab=` 도 같이 업데이트 → 새로고침/공유 시 같은 탭이 열린다.
  const setActiveTab = useCallback(
    (next: DashboardTabKey) => {
      setActiveTabState(next);
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (next === "my-posts") {
            params.delete("tab");
          } else {
            params.set("tab", next);
          }
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const stats = useMyBlogStats();
  const folders = useMyFolders();
  // folderId 를 "all" 로 보내면 백엔드가 type 필터를 무시하고
  // 항상 발행글을 반환한다 (BlogServiceImpl.getDocuments). 그래서 비워둔다.
  const list = useMyBlogListForTab(activeTab, {
    sort: sortKey,
    page: 0,
    size: 20,
  });

  const folderNameById = useMemo(() => {
    const map = new Map<string, string>();
    const arr: FoldersDTO[] | undefined = folders.data;
    if (Array.isArray(arr)) {
      arr.forEach((f) => {
        if (f.id) map.set(f.id, f.name);
      });
    }
    return map;
  }, [folders.data]);

  const documents: DocumentDTO[] = list.data?.documents ?? [];

  // 각 글의 조회수 / 좋아요 수를 병렬로 조회. 백엔드에 비정규화된 count가 없어
  // 카드 1개당 2번의 GET이 발생하지만 React Query 캐시로 중복 제거된다.
  const viewQueries = useQueries({
    queries: documents.map((doc) => ({
      queryKey: ["views", doc.id],
      queryFn: async () => {
        const res = await getViews({ params: { documentId: doc.id } });
        return res.data;
      },
      enabled: !!doc.id,
      staleTime: 1000 * 60 * 5,
    })),
  });

  // 액션 메뉴의 useToggleDocumentLike 가 같은 키를 invalidate 할 수 있도록
  // useDocumentLikeStatus 와 동일한 키 모양으로 맞춘다.
  const likeQueries = useQueries({
    queries: documents.map((doc) => ({
      queryKey: ["documentLikes", "status", doc.id],
      queryFn: async () => {
        const res = await getDocumentLikeStatus({
          params: { documentId: doc.id },
        });
        return res.data;
      },
      enabled: !!doc.id,
      staleTime: 1000 * 60 * 5,
    })),
  });

  const posts: DashboardPost[] = useMemo(() => {
    return documents.map((doc, idx) => {
      const id = doc.id ?? `idx-${idx}`;
      const viewData = viewQueries[idx]?.data;
      const likeData = likeQueries[idx]?.data;
      const category =
        (doc.folderId && folderNameById.get(doc.folderId)) || "Uncategorized";
      const status: PostStatus = doc.draft ? "DRAFT" : "PUBLISHED";

      return {
        id,
        thumbnail: doc.thumbnailImgUrl || null,
        title: doc.title || "Untitled",
        category,
        date: formatDate(doc.updated ?? doc.created),
        status,
        views:
          typeof viewData?.totalViews === "number" ? viewData.totalViews : null,
        likes:
          typeof likeData?.likeCount === "number" ? likeData.likeCount : null,
        gradient: pickGradient(id),
        // 백엔드 목록 응답에 isDeleted 가 빠져 있어도 휴지통 탭이면 복구 대상으로 본다
        isDeleted: Boolean(doc.isDeleted) || activeTab === "trash",
      };
    });
  }, [documents, viewQueries, likeQueries, folderNameById, activeTab]);

  const counts = useMemo(
    () => ({
      posts: stats.data.publishedCount,
      drafts: stats.data.draftCount,
      bookmarks: stats.data.bookmarkCount,
    }),
    [stats.data.publishedCount, stats.data.draftCount, stats.data.bookmarkCount],
  );

  const dashboardStats: DashboardStat[] = useMemo(() => {
    const viewsThisWeek = stats.data.viewsThisWeek;
    const viewsLastWeek = stats.data.viewsLastWeek;

    let viewsCaption = "—";
    if (viewsLastWeek > 0) {
      const diffPct = Math.round(
        ((viewsThisWeek - viewsLastWeek) / viewsLastWeek) * 100,
      );
      const sign = diffPct >= 0 ? "+" : "";
      viewsCaption = `${sign}${diffPct}% vs last week`;
    }

    const categoryCount = folderNameById.size;
    const publishedCaption = categoryCount
      ? `across ${categoryCount} ${categoryCount === 1 ? "category" : "categories"}`
      : "—";

    let draftsCaption = "—";
    if (stats.data.lastDraftEditedAt) {
      const m = moment(stats.data.lastDraftEditedAt);
      if (m.isValid()) {
        draftsCaption = `last edited ${m.fromNow()}`;
      }
    }

    return [
      {
        key: "views",
        label: "VIEWS THIS WEEK",
        value: viewsThisWeek > 0 ? formatNumber(viewsThisWeek) : "—",
        caption: viewsCaption,
      },
      {
        key: "published",
        label: "PUBLISHED",
        value: formatNumber(counts.posts),
        caption: publishedCaption,
      },
      {
        key: "drafts",
        label: "DRAFTS",
        value: formatNumber(counts.drafts),
        caption: draftsCaption,
      },
      {
        key: "bookmarks",
        label: "BOOKMARKS",
        value: formatNumber(counts.bookmarks),
        caption: counts.bookmarks > 0 ? "saved for later" : "—",
      },
    ];
  }, [stats.data, counts, folderNameById]);

  const summary = `${counts.posts} posts published · ${counts.drafts} drafts · ${counts.bookmarks} bookmarks`;
  const userName = currentUser?.nickname || currentUser?.username || "there";

  return {
    userName,
    summary,
    stats: dashboardStats,
    posts,
    counts,
    activeTab,
    setActiveTab,
    sortKey,
    setSortKey,
    isLoading: list.isLoading || stats.isLoading,
    isError: list.isError || stats.isError,
  };
}
