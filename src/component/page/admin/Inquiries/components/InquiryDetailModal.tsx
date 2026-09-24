// 관리자 — 문의 상세 모달: 발신자 · 본문(HTML 은 sandbox iframe) · 읽음 토글 · 삭제
import React, { useEffect, useMemo, useState } from "react";
import { Badge, Box, Button, Dialog, HStack, Portal, Spinner, Text, VStack } from "@chakra-ui/react";
import { Calendar, Mail, MailOpen, Paperclip, Reply, Trash2 } from "lucide-react";
import moment from "moment";
import { homeTokens, chakraDark } from "../../adminUi";
import {
  useAdminInquiry,
  useDeleteInquiry,
  useUpdateInquiryRead,
} from "../../../../../hooks/useInquiryQueries";

const t = homeTokens;

interface InquiryDetailModalProps {
  inquiryId: string;
  isOpen: boolean;
  onClose: () => void;
}

// HTML 본문은 외부에서 온 신뢰할 수 없는 마크업 → 스크립트/폼/네비게이션이 모두 막힌 sandbox iframe 에서만 렌더
function buildSrcDoc(html: string) {
  return `<!doctype html><html><head><meta charset="utf-8">
<style>
  body { margin: 0; padding: 12px; font-family: ${t.font.sans}; font-size: 14px; line-height: 1.6;
         color: ${t.color.text}; background: ${t.color.surface2}; word-break: break-word; }
  a { color: ${t.color.accent}; }
  img { max-width: 100%; height: auto; }
</style></head><body>${html}</body></html>`;
}

function formatSize(size?: number) {
  if (!size) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function InquiryDetailModal({ inquiryId, isOpen, onClose }: InquiryDetailModalProps) {
  const { data, isLoading } = useAdminInquiry(inquiryId);
  const updateRead = useUpdateInquiryRead();
  const deleteInquiry = useDeleteInquiry();
  const [confirmDelete, setConfirmDelete] = useState(false);

  // 열면 자동으로 읽음 처리 (한 번만)
  useEffect(() => {
    if (data && !data.isRead && !updateRead.isPending) {
      updateRead.mutate({ id: inquiryId, read: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.id]);

  const replyHref = useMemo(() => {
    if (!data?.fromEmail) return undefined;
    const subject = encodeURIComponent(`Re: ${data.subject || ""}`);
    return `mailto:${data.fromEmail}?subject=${subject}`;
  }, [data]);

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteInquiry.mutate({ id: inquiryId }, { onSuccess: onClose });
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e: { open: boolean }) => !e.open && onClose()} size="xl">
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.700" />
        <Dialog.Positioner>
          <Dialog.Content maxW="3xl" maxH="88vh" overflowY="auto" {...chakraDark.dialogContent}>
            <Dialog.Header borderBottomWidth="1px" borderColor={t.color.border} pb={3}>
              <VStack align="start" gap={1} pr={8}>
                <Dialog.Title fontSize="xl" fontWeight="bold" fontFamily={t.font.serif} color={t.color.text}>
                  {data?.subject || (isLoading ? "불러오는 중…" : "(제목 없음)")}
                </Dialog.Title>
                {data && (
                  <HStack gap={3} fontSize="xs" color={t.color.textMuted} flexWrap="wrap">
                    <HStack gap={1}>
                      <Mail size={12} />
                      <Text color={t.color.textSoft}>
                        {data.fromName ? `${data.fromName} <${data.fromEmail}>` : data.fromEmail}
                      </Text>
                    </HStack>
                    <HStack gap={1}>
                      <Calendar size={12} />
                      <Text>{data.receivedAt ? moment(data.receivedAt).format("YYYY.MM.DD HH:mm") : "-"}</Text>
                    </HStack>
                    <Text color={t.color.textFaint}>→ {data.recipient}</Text>
                  </HStack>
                )}
              </VStack>
            </Dialog.Header>

            <Dialog.Body mt={4}>
              {isLoading && (
                <HStack justify="center" py={12}>
                  <Spinner color={t.color.accent} />
                </HStack>
              )}

              {data && (
                <VStack align="stretch" gap={4}>
                  {/* 본문 */}
                  {data.htmlBody ? (
                    <Box
                      as="iframe"
                      // @ts-ignore — Chakra Box 에 iframe 속성 전달
                      sandbox=""
                      srcDoc={buildSrcDoc(data.htmlBody)}
                      title="inquiry-body"
                      w="full"
                      minH="360px"
                      borderWidth="1px"
                      borderColor={t.color.border}
                      borderRadius={t.radius.md}
                      bg={t.color.surface2}
                    />
                  ) : (
                    <Box
                      whiteSpace="pre-wrap"
                      fontSize="sm"
                      lineHeight="1.7"
                      color={t.color.text}
                      bg={t.color.surface2}
                      borderWidth="1px"
                      borderColor={t.color.border}
                      borderRadius={t.radius.md}
                      p={4}
                      minH="200px"
                    >
                      {data.textBody || "(본문 없음)"}
                    </Box>
                  )}

                  {/* 첨부 — 메타만 저장되어 있음. 원본은 S3(nadeliv-mail-inbox) 30일 보관 */}
                  {!!data.attachments?.length && (
                    <VStack align="stretch" gap={2}>
                      <HStack gap={1.5} color={t.color.textMuted} fontSize="xs">
                        <Paperclip size={12} />
                        <Text>첨부 {data.attachments.length}개 (파일은 원본 메일에만 포함)</Text>
                      </HStack>
                      {data.attachments.map((att, idx) => (
                        <HStack
                          key={`${att.filename}-${idx}`}
                          p={2.5}
                          borderWidth="1px"
                          borderColor={t.color.border}
                          borderRadius={t.radius.md}
                          fontSize="sm"
                          justify="space-between"
                        >
                          <Text color={t.color.text} lineClamp={1}>
                            {att.filename || "(이름 없음)"}
                          </Text>
                          <HStack gap={2} flexShrink={0}>
                            <Badge bg="whiteAlpha.100" color={t.color.textMuted} borderRadius={t.radius.pill} px={2}>
                              {att.contentType}
                            </Badge>
                            <Text color={t.color.textFaint} fontSize="xs">
                              {formatSize(att.size)}
                            </Text>
                          </HStack>
                        </HStack>
                      ))}
                    </VStack>
                  )}
                </VStack>
              )}
            </Dialog.Body>

            <Dialog.Footer mt={5} borderTopWidth="1px" borderColor={t.color.border} pt={3}>
              <HStack w="full" justify="space-between" flexWrap="wrap" gap={2}>
                <HStack gap={2}>
                  <Button
                    size="sm"
                    {...chakraDark.ghostBtn}
                    disabled={!data || updateRead.isPending}
                    onClick={() => data && updateRead.mutate({ id: inquiryId, read: !data.isRead })}
                  >
                    {data?.isRead ? <Mail size={14} /> : <MailOpen size={14} />}
                    {data?.isRead ? "안읽음으로 표시" : "읽음으로 표시"}
                  </Button>
                  <Button
                    size="sm"
                    color="#d99"
                    bg="transparent"
                    borderRadius={t.radius.pill}
                    _hover={{ bg: "rgba(180, 60, 60, 0.14)", color: "#eaa" }}
                    disabled={!data || deleteInquiry.isPending}
                    onClick={handleDelete}
                  >
                    <Trash2 size={14} />
                    {confirmDelete ? "정말 삭제할까요?" : "삭제"}
                  </Button>
                </HStack>
                <Button
                  size="sm"
                  {...chakraDark.primaryBtn}
                  disabled={!replyHref}
                  onClick={() => replyHref && window.open(replyHref, "_self")}
                >
                  <Reply size={14} />
                  메일로 답장
                </Button>
              </HStack>
            </Dialog.Footer>

            <Dialog.CloseTrigger color={t.color.textMuted} _hover={{ color: t.color.text, bg: "whiteAlpha.100" }} />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

export default InquiryDetailModal;
