import { Box, Container } from "@chakra-ui/react";
import useMyBlogDashboard from "./useMyBlogDashboard";
import DashboardHeader from "./components/DashboardHeader";
import StatCards from "./components/StatCards";
import FilterTabs from "./components/FilterTabs";
import PostListTable from "./components/PostListTable";
import Pagination from "./components/Pagination";
import { useCallback, useRef } from "react";

export interface MyBlogDashboardProps {}

function MyBlogDashboard(_props: MyBlogDashboardProps) {
  const {
    userName,
    summary,
    stats,
    posts,
    counts,
    activeTab,
    setActiveTab,
    sortKey,
    setSortKey,
    page,
    setPage,
    totalPages,
    totalCount,
    pageSize,
  } = useMyBlogDashboard();

  // 페이지를 넘기면 목록 상단(탭 줄)이 보이도록 스크롤
  const listTopRef = useRef<HTMLDivElement>(null);
  const handlePageChange = useCallback(
    (next: number) => {
      setPage(next);
      listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [setPage],
  );

  // 탭 별 fetch 는 hook 안에서 처리되므로 여기서는 들어온 posts 그대로 보여준다.
  return (
    <Box paddingY={"2.5rem"} bg={"#0a0a0a"} minH={"100vh"} color={"white"}>
      <Container maxW={"6xl"} px={{ base: 4, md: 6, lg: 8 }}>
        <DashboardHeader userName={userName} summary={summary} />
        <StatCards stats={stats} />
        <Box ref={listTopRef} scrollMarginTop={"1rem"} />
        <FilterTabs
          activeTab={activeTab}
          onChange={setActiveTab}
          counts={counts}
          sortKey={sortKey}
          onSortChange={setSortKey}
        />
        <PostListTable posts={posts} />
        <Pagination
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          onChange={handlePageChange}
        />
      </Container>
    </Box>
  );
}

export default MyBlogDashboard;
