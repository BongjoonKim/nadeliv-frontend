// src/types/inquiry/inquiryTypes.ts
// 관리자 문의함 API DTO (백엔드 /api/v1/admin/inquiries)

export interface InquiryAttachment {
  filename?: string;
  contentType?: string;
  size?: number;
}

export interface InquiryResponse {
  id: string;
  recipient?: string;
  fromName?: string;
  fromEmail?: string;
  subject?: string;
  preview?: string;
  // 상세 조회에서만 채워짐
  textBody?: string;
  htmlBody?: string;
  attachments?: InquiryAttachment[];
  attachmentCount?: number;
  receivedAt?: string;
  isRead: boolean;
  created?: string;
}

export interface InquiryListResponse {
  inquiries: InquiryResponse[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
  totalAll: number;
  unreadCount: number;
}

export type InquiryStatusFilter = "all" | "unread" | "read";
