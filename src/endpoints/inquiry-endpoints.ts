// src/endpoints/inquiry-endpoints.ts
// 관리자 문의함 API (백엔드 AdminInquiryController — admin 권한 필요)
import { FuncProps } from "../utils/useAuthEP";
import { request } from "../appConfig/request-response";

// 문의 목록 (상태 필터·페이징)
export const getAdminInquiries = async ({ accessToken, params }: FuncProps) => {
  const response = await request.get("/api/v1/admin/inquiries", {
    params: {
      page: params?.page ?? 0,
      size: params?.size ?? 20,
      status: params?.status || "all",
    },
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response;
};

// 문의 상세 (본문 포함)
export const getAdminInquiry = async ({ accessToken, params }: FuncProps) => {
  const response = await request.get(`/api/v1/admin/inquiries/${params.id}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response;
};

// 읽음/안읽음 변경
export const updateAdminInquiryRead = async ({ accessToken, params, reqBody }: FuncProps) => {
  const response = await request.patch(
    `/api/v1/admin/inquiries/${params.id}/read`,
    reqBody,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return response;
};

// 삭제 (soft delete)
export const deleteAdminInquiry = async ({ accessToken, params }: FuncProps) => {
  const response = await request.delete(`/api/v1/admin/inquiries/${params.id}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response;
};
