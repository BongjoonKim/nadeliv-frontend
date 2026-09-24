// /admin/inquiries — contact@nadeliv.com 으로 들어온 문의 메일 목록 (다크 세이지-그린 에디토리얼)
import React, { useMemo, useState } from "react";
import { Badge, Box, HStack, Pagination, Spinner, Text, VStack } from "@chakra-ui/react";
import { AlertCircle, Paperclip } from "lucide-react";
import moment from "moment";
import styled from "styled-components";
import { homeTokens, EmptyBox, TabButton } from "../adminUi";
import { useAdminInquiries } from "../../../../hooks/useInquiryQueries";
import { InquiryResponse, InquiryStatusFilter } from "../../../../types/inquiry/inquiryTypes";
import InquiryDetailModal from "./components/InquiryDetailModal";

const t = homeTokens;
const PAGE_SIZE = 20;

// 페이지네이션 트리거 다크 톤 공통 스타일 (Users 탭과 동일)
const pageBtnStyle = {
  px: 3,
  py: 2,
  borderWidth: "1px",
  borderColor: t.color.border,
  borderRadius: t.radius.md,
  color: t.color.textSoft,
  bg: "transparent",
  _hover: { bg: t.color.surface3 },
} as const;

const STATUS_FILTERS: { value: InquiryStatusFilter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "unread", label: "안읽음" },
  { value: "read", label: "읽음" },
];

function InquiriesAdmin() {
  const [status, setStatus] = useState<InquiryStatusFilter>("all");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, error } = useAdminInquiries({ page, size: PAGE_SIZE, status });

  const stats = useMemo(
    () => [
      { label: "전체 문의", value: data?.totalAll },
      { label: "안읽음", value: data?.unreadCount },
    ],
    [data]
  );

  if (error) {
    return (
      <HStack
        bg="rgba(180, 60, 60, 0.12)"
        borderWidth="1px"
        borderColor="rgba(221, 153, 153, 0.35)"
        borderRadius={t.radius.md}
        color="#eaa"
        p={4}
        gap={2}
      >
        <AlertCircle size={18} />
        <Text>문의 목록을 불러오는데 실패했습니다. 관리자 권한을 확인해주세요.</Text>
      </HStack>
    );
  }

  return (
    <>
      {/* 통계 요약 */}
      <HStack gap={3} mb={6} flexWrap="wrap">
        {stats.map((stat) => (
          <Box
            key={stat.label}
            bg={t.color.surface}
            borderWidth="1px"
            borderColor={t.color.border}
            borderRadius={t.radius.lg}
            px={5}
            py={3}
            minW="120px"
          >
            <Text fontSize="xs" color={t.color.textMuted} letterSpacing="0.06em">
              {stat.label}
            </Text>
            <Text fontSize="xl" fontWeight="bold" fontFamily={t.font.serif} color={t.color.text}>
              {stat.value ?? "-"}
            </Text>
          </Box>
        ))}
        <Box
          bg={t.color.surface}
          borderWidth="1px"
          borderColor={t.color.border}
          borderRadius={t.radius.lg}
          px={5}
          py={3}
          flex={1}
          minW="220px"
        >
          <Text fontSize="xs" color={t.color.textMuted} letterSpacing="0.06em">
            수신 주소
          </Text>
          <Text fontSize="sm" color={t.color.textSoft} mt={1}>
            contact@nadeliv.com 으로 온 메일이 여기에 쌓입니다. 답장은 메일 클라이언트에서 보내주세요.
          </Text>
        </Box>
      </HStack>

      {/* 상태 필터 */}
      <HStack gap={2} mb={5}>
        {STATUS_FILTERS.map((filter) => (
          <TabButton
            key={filter.value}
            $active={status === filter.value}
            onClick={() => {
              setStatus(filter.value);
              setPage(0);
            }}
          >
            {filter.label}
          </TabButton>
        ))}
      </HStack>

      {/* 로딩 */}
      {isLoading && (
        <HStack justify="center" align="center" h="48" w="full">
          <Spinner size="xl" color={t.color.accent} />
        </HStack>
      )}

      {/* 빈 상태 */}
      {!isLoading && (!data?.inquiries || data.inquiries.length === 0) && (
        <EmptyBox>
          <p className="empty-title">문의가 없습니다</p>
          <p className="empty-sub">
            {status === "unread" ? "안읽은 문의가 없습니다." : "아직 도착한 문의 메일이 없습니다."}
          </p>
        </EmptyBox>
      )}

      {/* 문의 목록 */}
      {!isLoading && data?.inquiries && data.inquiries.length > 0 && (
        <>
          <ListWrap>
            {data.inquiries.map((inquiry: InquiryResponse) => (
              <button
                key={inquiry.id}
                type="button"
                className={`row ${inquiry.isRead ? "" : "unread"}`}
                onClick={() => setSelectedId(inquiry.id)}
              >
                <span className="dot" aria-hidden />
                <VStack align="start" gap={0.5} flex={1} minW={0}>
                  <HStack gap={2} w="full" minW={0}>
                    <Text
                      fontSize="sm"
                      fontWeight={inquiry.isRead ? "medium" : "bold"}
                      color={t.color.text}
                      lineClamp={1}
                    >
                      {inquiry.subject || "(제목 없음)"}
                    </Text>
                    {!!inquiry.attachmentCount && (
                      <HStack gap={1} color={t.color.textFaint} flexShrink={0}>
                        <Paperclip size={12} />
                        <Text fontSize="xs">{inquiry.attachmentCount}</Text>
                      </HStack>
                    )}
                  </HStack>
                  <Text fontSize="xs" color={t.color.textMuted} lineClamp={1}>
                    {inquiry.preview || ""}
                  </Text>
                </VStack>
                <VStack align="end" gap={0.5} flexShrink={0} className="meta">
                  <Text fontSize="xs" color={t.color.textSoft} lineClamp={1}>
                    {inquiry.fromName || inquiry.fromEmail}
                  </Text>
                  <Text fontSize="xs" color={t.color.textFaint}>
                    {inquiry.receivedAt ? moment(inquiry.receivedAt).format("YYYY.MM.DD HH:mm") : "-"}
                  </Text>
                </VStack>
                {!inquiry.isRead && (
                  <Badge
                    bg={t.color.badgeBg}
                    color={t.color.badgeText}
                    borderRadius={t.radius.pill}
                    px={2.5}
                    fontSize="10px"
                    flexShrink={0}
                  >
                    NEW
                  </Badge>
                )}
              </button>
            ))}
          </ListWrap>

          {/* 페이지네이션 */}
          {data.totalPages > 1 && (
            <HStack justify="center" mt={6}>
              <Pagination.Root
                count={data.totalCount}
                pageSize={PAGE_SIZE}
                page={page + 1}
                onPageChange={(details: any) => setPage(details.page - 1)}
              >
                <HStack gap={2}>
                  <Pagination.PrevTrigger {...pageBtnStyle}>이전</Pagination.PrevTrigger>
                  <Pagination.Items
                    render={(pageItem) =>
                      pageItem.type === "page" ? (
                        <Pagination.Item
                          {...pageItem}
                          {...pageBtnStyle}
                          _selected={{
                            bg: t.color.accentStrong,
                            color: t.color.text,
                            borderColor: "transparent",
                          }}
                        >
                          {pageItem.value}
                        </Pagination.Item>
                      ) : (
                        <Pagination.Ellipsis {...pageItem}>
                          <Text px={2} color={t.color.textFaint}>
                            ...
                          </Text>
                        </Pagination.Ellipsis>
                      )
                    }
                  />
                  <Pagination.NextTrigger {...pageBtnStyle}>다음</Pagination.NextTrigger>
                </HStack>
              </Pagination.Root>
            </HStack>
          )}
        </>
      )}

      {/* 상세 모달 */}
      {selectedId && (
        <InquiryDetailModal
          inquiryId={selectedId}
          isOpen={!!selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </>
  );
}

const ListWrap = styled.div`
  width: 100%;
  border: 1px solid ${t.color.border};
  border-radius: ${t.radius.lg};
  background: ${t.color.surface};
  overflow: hidden;

  .row {
    appearance: none;
    border: none;
    background: transparent;
    width: 100%;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 18px;
    border-bottom: 1px solid ${t.color.border};
    cursor: pointer;
    text-align: left;
    font-family: ${t.font.sans};
    transition: background 0.15s ease;
  }

  .row:last-child {
    border-bottom: none;
  }

  .row:hover {
    background: ${t.color.surface3};
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: transparent;
    flex-shrink: 0;
  }

  .row.unread .dot {
    background: ${t.color.accent};
  }

  .meta {
    max-width: 180px;
  }

  @media (max-width: 640px) {
    .meta {
      display: none;
    }
  }
`;

export default InquiriesAdmin;
