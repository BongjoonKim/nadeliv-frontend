import {ViewDocLayoutProps} from "./ViewDocLayout";
import {useCallback, useEffect} from "react";
import {useQueryClient} from "@tanstack/react-query";
import {useRecoilState} from "recoil";
import recoil from "../../../../../stores/recoil";
import {deleteDocument} from "../../../../../endpoints/blog-endpoints";
import {useNavigate} from "react-router-dom";
import {useAtom} from "jotai";
import {isBookmark} from "../../../../../stores/jotai/jotai";
import {createBookmark, deleteBookmark} from "../../../../../endpoints/bookmark-endpoints";
import {ERROR_MESSAGE} from "../../../../../stores/recoil/recoilConstants";
import {ErrorMessageProps} from "../../../../../stores/recoil/types";
import useAuthEP from "../../../../../utils/useAuthEP";
import {useCurrentUser} from "../../../../../hooks/useCurrentUser";
import {useGetViews, useIncreaseView} from "../../../../../hooks/useBlogQueries";
import {useDocumentLikeStatus, useToggleDocumentLike} from "../../../../../hooks/useDocumentLikeQueries";
import {confirmDialog} from "../../../../elements/ConfirmDialog";
import {toaster} from "../../../../elements/toaster";

export default function useViewDocLayout(props : ViewDocLayoutProps) {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useRecoilState(recoil.errMsg);
  const [isBookmarked, setBookmarked] = useAtom(isBookmark);
  const [errMsg, setErrMsg] = useRecoilState(recoil.errMsg);
  const authEP = useAuthEP();
  const queryClient = useQueryClient();
  const {data : currentUser} = useCurrentUser();
  // 조회수 정보
  const {data : views} = useGetViews(props.id)
  const increaseViewMutation = useIncreaseView();

  useEffect(() => {
    if (props.id) {
      increaseViewMutation.mutate(props.id);
    }
  }, [props.id]);

  // 좋아요 정보
  const { data: likeStatus } = useDocumentLikeStatus(props.id);
  const toggleLikeMutation = useToggleDocumentLike(props.id!);
  
  // 수정 화면으로 전환 (현재 보고 있는 locale 기반으로 이동)
  const i18n = props.i18nState;
  const handleEdit = useCallback(() => {
    const locale = i18n?.currentLocale || 'ko';
    navigate(`/blog/edit/${locale}/${props.id}`);
  }, [props.id, i18n, navigate]);
  
  const handleDelete = useCallback(async () => {
    const ok = await confirmDialog({
      title: "이 글을 휴지통으로 옮길까요?",
      description: "휴지통에서 90일 안에 복구할 수 있어요.",
      confirmText: "휴지통으로",
      tone: "danger",
    });
    if (!ok) return;
    try {
      // Soft delete: 백엔드가 휴지통(isDeleted=true)으로 옮기고
      // 90일 뒤 BlogCleanupScheduler가 본문/이미지/cascade 데이터를 영구 삭제함.
      // 따라서 프론트에서 더 이상 S3 직접 삭제를 하지 않음 (복구 가능성 보존).
      await authEP({
        func : deleteDocument,
        params : {id : props?.id}
      })
      // 대시보드 목록/카운트 캐시 무효화 — 삭제한 글이 목록(draft)에 남아 보이는 문제 방지
      queryClient.invalidateQueries({ queryKey: ["my-blog"] });
      queryClient.invalidateQueries({ queryKey: ["my-blog-stats"] });
      toaster.create({ title: "휴지통으로 옮겼어요", type: "success", duration: 2500 });
      navigate(-1)
    } catch (e) {
      setErrorMsg({
        status: "error",
        msg: "삭제에 실패했습니다.",
      })
    }

  }, [props, queryClient, navigate, authEP, setErrorMsg]);
  
  const changeBookmark = useCallback(async () => {
    try {
      if (isBookmarked) {
        const res = await authEP({
          func : deleteBookmark,
          params : {
            documentId : props.id
          },
        })
        console.log("삭제해보기", res)
        if (res.status !== 200) {
          throw res.statusText;
        }
        setBookmarked(false);
      } else {
        const reqBody: BookmarkDTO = {
          documentId: props.id
        }
        const res = await authEP({
          func: createBookmark,
          reqBody: reqBody,
        })
        if (res.status !== 200) {
          throw res.statusText;
        }
        setBookmarked(true);
      }
    } catch (e : ErrorMessageProps | unknown) {
      setErrMsg({
        status: "error",
        msg: e?.toString(),
      })
    }
  }, [isBookmarked, props]);
  
  // 좋아요 토글 핸들러
  const handleToggleLike = useCallback(() => {
    if (!currentUser?.id) {
      setErrMsg({
        status: "warning",
        msg: "로그인이 필요합니다.",
      });
      return;
    }
    toggleLikeMutation.mutate();
  }, [currentUser, toggleLikeMutation]);
  
  return {
    handleEdit,
    handleDelete,
    changeBookmark,
    currentUser,
    views,
    likeStatus,
    handleToggleLike,
    isLiking: toggleLikeMutation.isPending,
  }

}