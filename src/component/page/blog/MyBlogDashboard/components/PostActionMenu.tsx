import { useState } from "react";
import { Box, Menu, MenuContent, MenuItem, MenuRoot, MenuTrigger, Portal } from "@chakra-ui/react";
import { MoreHorizontal, Bookmark, Heart, Pencil, Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useBlogLocale } from "../../../../../hooks/useBlogLocale";
import useAuthEP from "../../../../../utils/useAuthEP";
import {
  createBookmark,
  deleteBookmark,
  getIsBookmarked,
} from "../../../../../endpoints/bookmark-endpoints";
import {
  documentLikeKeys,
  useDocumentLikeStatus,
  useToggleDocumentLike,
} from "../../../../../hooks/useDocumentLikeQueries";
import { deleteDocument } from "../../../../../endpoints/blog-endpoints";

interface PostActionMenuProps {
  postId: string;
}

function PostActionMenu({ postId }: PostActionMenuProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { activeLocale } = useBlogLocale();
  const authEP = useAuthEP();
  const queryClient = useQueryClient();

  const { data: likeStatus } = useDocumentLikeStatus(postId);
  const toggleLike = useToggleDocumentLike(postId);

  // 북마크 상태는 메뉴가 열렸을 때만 fetch — 행이 20개일 때 일괄 호출을 피하기 위함.
  const { data: isBookmarked } = useQuery<boolean>({
    queryKey: ["isBookmarked", postId],
    queryFn: async () => {
      const res = await authEP({
        func: getIsBookmarked,
        params: { documentId: postId },
      });
      return Boolean(res.data);
    },
    enabled: open && !!postId,
    staleTime: 1000 * 30,
  });

  const stop = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  const handleBookmarkToggle = async () => {
    try {
      if (isBookmarked) {
        await authEP({ func: deleteBookmark, params: { documentId: postId } });
      } else {
        await authEP({ func: createBookmark, reqBody: { documentId: postId } });
      }
      queryClient.setQueryData(["isBookmarked", postId], !isBookmarked);
      // 북마크 카운트 / 북마크 탭 갱신
      queryClient.invalidateQueries({ queryKey: ["my-blog-stats", "bookmark"] });
      queryClient.invalidateQueries({ queryKey: ["my-blog", "bookmarks"] });
    } catch (e) {
      console.error("bookmark toggle failed", e);
    }
  };

  const handleLikeToggle = () => {
    toggleLike.mutate();
  };

  const handleEdit = () => {
    navigate(`/blog/edit/${activeLocale}/${postId}`);
  };

  const handleDelete = async () => {
    const ok = window.confirm("이 글을 휴지통으로 옮길까요?");
    if (!ok) return;
    try {
      await authEP({ func: deleteDocument, params: { id: postId } });
      // 목록과 카운트 모두 갱신 — invalidate 로 한 번에 처리
      queryClient.invalidateQueries({ queryKey: ["my-blog"] });
      queryClient.invalidateQueries({ queryKey: ["my-blog-stats"] });
    } catch (e) {
      console.error("delete failed", e);
    }
  };

  return (
    <Box onClick={stop}>
      <MenuRoot open={open} onOpenChange={(d: { open: boolean }) => setOpen(d.open)}>
        <MenuTrigger asChild>
          <Box
            as={"button"}
            display={"inline-flex"}
            alignItems={"center"}
            justifyContent={"center"}
            width={"28px"}
            height={"28px"}
            bg={"transparent"}
            color={"rgba(255,255,255,0.5)"}
            cursor={"pointer"}
            borderRadius={"md"}
            _hover={{ color: "rgba(255,255,255,0.95)", bg: "rgba(255,255,255,0.06)" }}
            _focus={{ outline: "none" }}
          >
            <MoreHorizontal size={16} />
          </Box>
        </MenuTrigger>
        <Portal>
          <Menu.Positioner>
            <MenuContent
              css={{
                zIndex: 99999,
                backgroundColor: "#1a1a1a",
                border: "0.5px solid rgba(255,255,255,0.12)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                minWidth: "180px",
                padding: "4px",
              }}
            >
              <MenuItem
                value="bookmark"
                onClick={handleBookmarkToggle}
                css={menuItemCss(isBookmarked ? "#d4a574" : undefined)}
              >
                <Bookmark
                  size={14}
                  style={{ marginRight: 8 }}
                  fill={isBookmarked ? "#d4a574" : "none"}
                />
                {isBookmarked ? "Bookmarked" : "Bookmark"}
              </MenuItem>
              <MenuItem
                value="like"
                onClick={handleLikeToggle}
                css={menuItemCss(likeStatus?.isLiked ? "#e57373" : undefined)}
              >
                <Heart
                  size={14}
                  style={{ marginRight: 8 }}
                  fill={likeStatus?.isLiked ? "#e57373" : "none"}
                />
                {likeStatus?.isLiked ? "Liked" : "Like"}
                <Box marginLeft={"auto"} fontSize={"12px"} color={"rgba(255,255,255,0.45)"}>
                  {likeStatus?.likeCount ?? 0}
                </Box>
              </MenuItem>
              <MenuItem value="edit" onClick={handleEdit} css={menuItemCss()}>
                <Pencil size={14} style={{ marginRight: 8 }} />
                Edit
              </MenuItem>
              <MenuItem value="delete" onClick={handleDelete} css={menuItemCss("#e57373")}>
                <Trash2 size={14} style={{ marginRight: 8 }} />
                Delete
              </MenuItem>
            </MenuContent>
          </Menu.Positioner>
        </Portal>
      </MenuRoot>
    </Box>
  );
}

function menuItemCss(textColor?: string) {
  return {
    color: textColor || "rgba(255,255,255,0.85)",
    fontSize: "13px",
    padding: "8px 10px",
    borderRadius: "4px",
    cursor: "pointer",
    "&[data-highlighted]": {
      backgroundColor: "rgba(255,255,255,0.06)",
      color: textColor || "rgba(255,255,255,0.95)",
    },
  } as const;
}

export default PostActionMenu;
