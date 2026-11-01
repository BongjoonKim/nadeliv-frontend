import { Box, Flex, Grid, HStack, Text } from "@chakra-ui/react";
import { Eye, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useBlogLocale } from "../../../../../hooks/useBlogLocale";
import type { DashboardPost } from "../useMyBlogDashboard";
import PostActionMenu from "./PostActionMenu";

interface PostListRowProps {
  post: DashboardPost;
  isLast: boolean;
}

const STATUS_STYLE: Record<DashboardPost["status"], { bg: string; color: string; label: string }> = {
  PUBLISHED: { bg: "rgba(95,160,120,0.15)", color: "#7fb89a", label: "Published" },
  DRAFT: { bg: "rgba(212,165,116,0.15)", color: "#d4a574", label: "Draft" },
};

function PostListRow({ post, isLast }: PostListRowProps) {
  const status = STATUS_STYLE[post.status];
  const navigate = useNavigate();
  const { blogViewUrl } = useBlogLocale();

  const handleRowClick = () => {
    if (!post.id) return;
    navigate(blogViewUrl(post.id));
  };

  return (
    <Grid
      templateColumns={{
        base: "64px 1fr 32px",
        md: "80px 1fr 100px 80px 80px 32px",
      }}
      alignItems={"center"}
      gap={{ base: "0.75rem", md: "1rem" }}
      paddingX={{ base: "0.75rem", md: "1rem" }}
      paddingY={"0.75rem"}
      borderBottom={isLast ? "none" : "0.5px solid"}
      borderColor={"rgba(255,255,255,0.06)"}
      cursor={"pointer"}
      onClick={handleRowClick}
      _hover={{ bg: "rgba(255,255,255,0.025)" }}
      transition={"background 0.15s ease"}
    >
      {/* 썸네일 */}
      <Box
        width={{ base: "64px", md: "80px" }}
        height={{ base: "48px", md: "56px" }}
        borderRadius={"md"}
        bg={post.thumbnail ? undefined : post.gradient}
        backgroundImage={post.thumbnail ? `url(${post.thumbnail})` : undefined}
        backgroundSize={"cover"}
        backgroundPosition={"center"}
        flexShrink={0}
      />

      {/* 제목 + 메타 */}
      <Box minW={0}>
        <Text
          fontSize={{ base: "14px", md: "14px" }}
          fontWeight={500}
          color={"rgba(255,255,255,0.92)"}
          lineHeight={1.3}
          mb={"0.25rem"}
          overflow={"hidden"}
          textOverflow={"ellipsis"}
          whiteSpace={{ base: "normal", md: "nowrap" }}
          css={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {post.title}
        </Text>
        <Text
          fontSize={"12px"}
          color={"rgba(255,255,255,0.45)"}
          overflow={"hidden"}
          textOverflow={"ellipsis"}
          whiteSpace={"nowrap"}
        >
          {post.category} · {post.date}
        </Text>

        {/* 모바일 전용: 상태/조회수/좋아요 inline */}
        <HStack
          display={{ base: "flex", md: "none" }}
          gap={"0.75rem"}
          mt={"0.5rem"}
          color={"rgba(255,255,255,0.55)"}
          fontSize={"12px"}
          flexWrap={"wrap"}
        >
          <Text
            display={"inline-block"}
            fontSize={"10px"}
            fontWeight={500}
            color={status.color}
            bg={status.bg}
            paddingX={"6px"}
            paddingY={"2px"}
            borderRadius={"sm"}
          >
            {status.label}
          </Text>
          <Flex align={"center"} gap={"0.25rem"}>
            <Eye size={12} />
            <Text>{post.views !== null ? post.views.toLocaleString() : "—"}</Text>
          </Flex>
          <Flex align={"center"} gap={"0.25rem"}>
            <Heart size={12} />
            <Text>{post.likes !== null ? post.likes.toLocaleString() : "—"}</Text>
          </Flex>
        </HStack>
      </Box>

      {/* 데스크탑 전용: 상태 뱃지 */}
      <Box display={{ base: "none", md: "block" }}>
        <Text
          display={"inline-block"}
          fontSize={"11px"}
          fontWeight={500}
          color={status.color}
          bg={status.bg}
          paddingX={"8px"}
          paddingY={"3px"}
          borderRadius={"sm"}
        >
          {status.label}
        </Text>
      </Box>

      {/* 데스크탑 전용: 조회수 */}
      <Flex
        display={{ base: "none", md: "flex" }}
        align={"center"}
        gap={"0.35rem"}
        color={"rgba(255,255,255,0.6)"}
      >
        <Eye size={13} />
        <Text fontSize={"13px"}>{post.views !== null ? post.views.toLocaleString() : "—"}</Text>
      </Flex>

      {/* 데스크탑 전용: 좋아요 */}
      <Flex
        display={{ base: "none", md: "flex" }}
        align={"center"}
        gap={"0.35rem"}
        color={"rgba(255,255,255,0.6)"}
      >
        <Heart size={13} />
        <Text fontSize={"13px"}>{post.likes !== null ? post.likes.toLocaleString() : "—"}</Text>
      </Flex>

      {/* 더보기 액션 메뉴 — 행 클릭 이벤트는 메뉴 내부에서 stopPropagation */}
      <Flex justify={"center"}>
        <PostActionMenu postId={post.id} isDeleted={post.isDeleted} />
      </Flex>
    </Grid>
  );
}

export default PostListRow;
