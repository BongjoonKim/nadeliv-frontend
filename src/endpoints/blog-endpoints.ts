import {request} from "../appConfig/request-response";
import {AxiosResponse} from "axios";
import {FuncProps} from "../utils/useAuthEP";
import {DocumentViewResponse, IncreaseViewRequest, PopularPostDTO, ViewStatsDTO} from "../types/blog/blogTypes";

export async function createDocument(props : FuncProps) {
  return (await request.post("blog/document", props.reqBody, {
    headers : {
      Authorization : `Bearer ${props.accessToken}`
    }
  })) as AxiosResponse<DocumentDTO>;
};

export async function createAfterSaveDocument(props : FuncProps) {
  return (await request.put('blog/document/content', props.reqBody, {
    headers: {
      Authorization : `Bearer ${props.accessToken}`
    }
  })) as AxiosResponse<DocumentDTO>
}

export async function saveDocument(props : FuncProps) {
  return (await request.put('blog/document', props.reqBody, {
    headers: {
      Authorization : `Bearer ${props.accessToken}`
    }
  })) as AxiosResponse<DocumentDTO>
}

export async function getAllDocuments(props : FuncProps) {
  const localeParam = props.params?.locale ? `&locale=${props.params.locale}` : '';
  return (await request.get(`blog/ps/documents?page=${props.params?.page}&size=${props.params?.size}&folderId=${props.params?.folderId}&dateSort=${props.params?.dateSort}${localeParam}`
  )) as AxiosResponse<DocumentsInfo>
}

export async function searchDocuments(props : FuncProps) {
  return (await request.get(`blog/ps/search/documents?value=${props.params?.value}&page=${props.params?.page}&size=${props.params?.size}`
  )) as AxiosResponse<DocumentsInfo>
}

export async function getDocumentsByAuth(props : FuncProps) {
  const localeParam = props.params?.locale ? `&locale=${props.params.locale}` : '';
  return (await request.get(`blog/documents?page=${props.params?.page}&size=${props.params?.size}&folderId=${props.params?.folderId}&type=${props.params?.type}&dateSort=${props.params?.dateSort}${localeParam}`, {
    headers: {
      Authorization : `Bearer ${props.accessToken}`
    }
  })) as AxiosResponse<DocumentsInfo>
}

export async function getDocument(props : FuncProps) {
  return (await request.get(`blog/ps/document?id=${props.params?.id}`)) as AxiosResponse<DocumentDTO>
};

export async function deleteDocument(props : FuncProps) {
  // 백엔드가 로그인 사용자(작성자 본인)만 삭제 허용 → Authorization 필수
  return (await request.delete(`blog/ps/document?id=${props.params?.id}`, {
    headers: {
      Authorization: `Bearer ${props.accessToken}`
    }
  })) as AxiosResponse<any>;
}

// 휴지통에서 글 복구
export async function restoreDocument(props : FuncProps) {
  return (await request.patch(`blog/document/${props.params?.id}/restore`, undefined, {
    headers: {
      Authorization: `Bearer ${props.accessToken}`
    }
  })) as AxiosResponse<any>;
}

// Featured 관련 엔드포인트
export async function getActiveFeaturedDocuments(props: FuncProps) {
  return (await request.get(`blog/ps/featured/active`, {
    params: {
      limit: props.params?.limit || 3
    }
  })) as AxiosResponse<DocumentDTO[]>;
}

export async function setDocumentAsFeatured(props: FuncProps) {
  return (await request.put(`blog/document/${props.params?.id}/feature`, props.reqBody, {
    headers: {
      Authorization: `Bearer ${props.accessToken}`
    }
  })) as AxiosResponse<DocumentDTO>;
}

export async function removeFromFeatured(props: FuncProps) {
  return (await request.delete(`blog/document/${props.params?.id}/feature`, {
    headers: {
      Authorization: `Bearer ${props.accessToken}`
    }
  })) as AxiosResponse<DocumentDTO>;
}

export async function updateFeaturedInfo(props: FuncProps) {
  return (await request.patch(`blog/document/${props.params?.id}/feature`, props.reqBody, {
    headers: {
      Authorization: `Bearer ${props.accessToken}`
    }
  })) as AxiosResponse<DocumentDTO>;
}

export async function getFeaturableDocuments(props: FuncProps) {
  const searchParam = props.params?.search ? `&search=${props.params.search}` : '';
  return (await request.get(`blog/documents/featurable?page=${props.params?.page || 0}&size=${props.params?.size || 20}${searchParam}`, {
    headers: {
      Authorization: `Bearer ${props.accessToken}`
    }
  })) as AxiosResponse<DocumentsInfo>;
}

export async function getFeaturedHistory(props: FuncProps) {
  return (await request.get(`blog/featured/history?page=${props.params?.page || 0}&size=${props.params?.size || 10}`, {
    headers: {
      Authorization: `Bearer ${props.accessToken}`
    }
  })) as AxiosResponse<DocumentsInfo>;
}

// 인기 글 Top N (사이드바 "Popular this month" 위젯용, 비인증)
export async function getPopularPosts(props: FuncProps) {
  return (await request.get(`blog/ps/popular`, {
    params: {
      period: props.params?.period || 'month',
      limit: props.params?.limit || 3,
    }
  })) as AxiosResponse<PopularPostDTO[]>;
}

// 내가 팔로우 중인 사용자들의 발행 글 피드 (인증 필요)
export async function getFollowingFeed(props: FuncProps) {
  const localeParam = props.params?.locale ? `&locale=${props.params.locale}` : '';
  const dateSortParam = props.params?.dateSort ? `&dateSort=${props.params.dateSort}` : '';
  return (await request.get(
    `blog/following?page=${props.params?.page || 0}&size=${props.params?.size || 24}${dateSortParam}${localeParam}`,
    {
      headers: {
        Authorization: `Bearer ${props.accessToken}`,
      },
    }
  )) as AxiosResponse<DocumentsInfo>;
}

/// ViewEndPoints

// 블로그 글 조회수 보기
export async function getViews(props: FuncProps) {
  return (await request.get(`api/v1/views/ps/${props.params.documentId}`)
  ) as AxiosResponse<DocumentViewResponse>;
}

// 조회수 증가 api
export async function increaseView(props : FuncProps) {
  return (await request.post(`api/v1/views/ps/${props.params.documentId}`)
  ) as AxiosResponse<IncreaseViewRequest>;
}

// 블로그 상세 조회 통계
export async function getViewStats(props: FuncProps) {
  return (await request.get(`api/v1/views/ps/${props.params.documentId}/stats`)
  ) as AxiosResponse<ViewStatsDTO>;
}