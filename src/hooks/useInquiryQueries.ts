// src/hooks/useInquiryQueries.ts
// 관리자 문의함 Query/Mutation 훅
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useAuthEP from "../utils/useAuthEP";
import {
  deleteAdminInquiry,
  getAdminInquiries,
  getAdminInquiry,
  updateAdminInquiryRead,
} from "../endpoints/inquiry-endpoints";
import {
  InquiryListResponse,
  InquiryResponse,
  InquiryStatusFilter,
} from "../types/inquiry/inquiryTypes";

const ADMIN_INQUIRIES_KEY = ["admin", "inquiries"] as const;

// 문의 목록
export const useAdminInquiries = (params: {
  page?: number;
  size?: number;
  status?: InquiryStatusFilter;
}) => {
  const authEP = useAuthEP();

  return useQuery<InquiryListResponse>({
    queryKey: [...ADMIN_INQUIRIES_KEY, "list", params],
    queryFn: async () => {
      const response = await authEP({
        func: getAdminInquiries,
        params: {
          page: params.page ?? 0,
          size: params.size ?? 20,
          status: params.status ?? "all",
        },
      });
      return response.data;
    },
    staleTime: 1000 * 30, // 새 문의가 들어오는 화면이라 짧게
    gcTime: 1000 * 60 * 5,
    retry: 1,
  });
};

// 문의 상세
export const useAdminInquiry = (id: string | null) => {
  const authEP = useAuthEP();

  return useQuery<InquiryResponse>({
    queryKey: [...ADMIN_INQUIRIES_KEY, "detail", id],
    queryFn: async () => {
      const response = await authEP({
        func: getAdminInquiry,
        params: { id },
      });
      return response.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
    retry: 1,
  });
};

// 읽음/안읽음 변경 → 목록·상세·(헤더 뱃지용) 캐시 무효화
export const useUpdateInquiryRead = () => {
  const authEP = useAuthEP();
  const queryClient = useQueryClient();

  return useMutation<InquiryResponse, Error, { id: string; read: boolean }>({
    mutationFn: async ({ id, read }) => {
      const response = await authEP({
        func: updateAdminInquiryRead,
        params: { id },
        reqBody: { read },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_INQUIRIES_KEY });
    },
  });
};

// 삭제
export const useDeleteInquiry = () => {
  const authEP = useAuthEP();
  const queryClient = useQueryClient();

  return useMutation<void, Error, { id: string }>({
    mutationFn: async ({ id }) => {
      await authEP({
        func: deleteAdminInquiry,
        params: { id },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_INQUIRIES_KEY });
    },
  });
};
