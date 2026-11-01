// 관리자 — 사용자 상세 모달: 기본 정보 · 권한 부여 · 탈퇴/복구 · 작성한 글 · 여행 프로젝트
import React, { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Dialog,
  HStack,
  Image,
  Portal,
  Spinner,
  Switch,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  Calendar,
  ExternalLink,
  FileText,
  Map,
  RotateCcw,
  Save,
  Shield,
  UserX,
  Users as UsersIcon,
} from "lucide-react";
import moment from "moment";
import { homeTokens, chakraDark } from "../../adminUi";
import {
  useAdminUserDetail,
  useUpdateAdminUserRoles,
  useUpdateAdminUserStatus,
} from "../../../../../hooks/useAdminUserQueries";
import { AdminUserDocument, AdminUserTravel } from "../../../../../types/admin/adminUserTypes";
import { confirmDialog } from "../../../../../common/elements/ConfirmDialog";

const t = homeTokens;

const TRAVEL_STATUS_LABEL: Record<string, string> = {
  PLANNING: "계획중",
  IN_PROGRESS: "여행중",
  COMPLETED: "완료",
};

interface UserDetailModalProps {
  userId: string;
  currentUserId?: string; // 로그인한 관리자 본인 (본인 권한·상태 변경 방지)
  isOpen: boolean;
  onClose: () => void;
}

function DocumentRow({ doc }: { doc: AdminUserDocument }) {
  const statusBadge = doc.deleted
    ? { label: "휴지통", bg: "rgba(180, 60, 60, 0.18)", color: "#eaa" }
    : doc.draft
    ? { label: "임시저장", bg: "whiteAlpha.200", color: t.color.textSoft }
    : { label: "게시됨", bg: t.color.badgeBg, color: t.color.badgeText };

  return (
    <HStack
      w="full"
      p={3}
      gap={3}
      borderWidth="1px"
      borderColor={t.color.border}
      borderRadius={t.radius.md}
      _hover={{ borderColor: t.color.border2 }}
      transition="border-color 0.15s ease"
    >
      {doc.thumbnailImgUrl && (
        <Image
          src={doc.thumbnailImgUrl}
          alt=""
          boxSize="44px"
          borderRadius={t.radius.md}
          objectFit="cover"
          flexShrink={0}
        />
      )}
      <VStack align="start" gap={0.5} flex={1} minW={0}>
        <Text fontSize="sm" fontWeight="medium" color={t.color.text} lineClamp={1}>
          {doc.title || "(제목 없음)"}
        </Text>
        <HStack fontSize="xs" color={t.color.textFaint} gap={2}>
          <HStack gap={1}>
            <Calendar size={12} />
            <Text>{doc.created ? moment(doc.created).format("YYYY.MM.DD") : "-"}</Text>
          </HStack>
          {!doc.disclose && !doc.draft && <Text>비공개</Text>}
        </HStack>
      </VStack>
      <Badge bg={statusBadge.bg} color={statusBadge.color} borderRadius={t.radius.pill} px={2.5} flexShrink={0}>
        {statusBadge.label}
      </Badge>
      <Button
        size="xs"
        variant="ghost"
        color={t.color.textMuted}
        _hover={{ color: t.color.text, bg: "whiteAlpha.100" }}
        onClick={() => window.open(`/blog/view/${doc.id}`, "_blank")}
        flexShrink={0}
      >
        <ExternalLink size={14} />
      </Button>
    </HStack>
  );
}

function TravelRow({ travel }: { travel: AdminUserTravel }) {
  const period =
    travel.startDate || travel.endDate
      ? `${travel.startDate ? moment(travel.startDate).format("YYYY.MM.DD") : "?"} ~ ${
          travel.endDate ? moment(travel.endDate).format("YYYY.MM.DD") : "?"
        }`
      : null;

  return (
    <HStack
      w="full"
      p={3}
      gap={3}
      borderWidth="1px"
      borderColor={t.color.border}
      borderRadius={t.radius.md}
      _hover={{ borderColor: t.color.border2 }}
      transition="border-color 0.15s ease"
    >
      <VStack align="start" gap={0.5} flex={1} minW={0}>
        <HStack gap={2}>
          <Text fontSize="sm" fontWeight="medium" color={t.color.text} lineClamp={1}>
            {travel.title || "(제목 없음)"}
          </Text>
          {travel.role === "ADMIN" && (
            <Badge bg={t.color.badgeBg} color={t.color.badgeText} borderRadius={t.radius.pill} px={2} fontSize="10px">
              생성자
            </Badge>
          )}
        </HStack>
        <HStack fontSize="xs" color={t.color.textFaint} gap={2} flexWrap="wrap">
          {travel.destination && (
            <HStack gap={1}>
              <Map size={12} />
              <Text>{travel.destination}</Text>
            </HStack>
          )}
          {period && <Text>{period}</Text>}
          <HStack gap={1}>
            <UsersIcon size={12} />
            <Text>{travel.memberCount ?? 0}명</Text>
          </HStack>
        </HStack>
      </VStack>
      {travel.status && (
        <Badge
          bg="transparent"
          borderWidth="1px"
          borderColor={t.color.border2}
          color={t.color.textSoft}
          borderRadius={t.radius.pill}
          px={2.5}
          flexShrink={0}
        >
          {TRAVEL_STATUS_LABEL[travel.status] || travel.status}
        </Badge>
      )}
    </HStack>
  );
}

function UserDetailModal({ userId, currentUserId, isOpen, onClose }: UserDetailModalProps) {
  const [docPage, setDocPage] = useState(0);
  const { data, isLoading } = useAdminUserDetail(isOpen ? userId : null, docPage);
  const { mutate: updateRoles, isPending: isSavingRoles } = useUpdateAdminUserRoles();
  const { mutate: updateStatus, isPending: isSavingStatus } = useUpdateAdminUserStatus();

  const [isAdmin, setIsAdmin] = useState(false);
  const user = data?.user;
  const isSelf = !!currentUserId && currentUserId === userId;

  // 서버 데이터가 로드/갱신되면 권한 토글 상태 동기화
  useEffect(() => {
    if (user) setIsAdmin(user.roles?.includes("admin") ?? false);
  }, [user]);

  const roleDirty = !!user && isAdmin !== (user.roles?.includes("admin") ?? false);

  const handleSaveRoles = () => {
    updateRoles({ userId, roles: isAdmin ? ["user", "admin"] : ["user"] });
  };

  const handleToggleStatus = async () => {
    if (!user) return;
    const next = !user.enabled;
    const ok = await confirmDialog(
      next
        ? { title: `${user.userId} 계정을 복구할까요?`, confirmText: "복구" }
        : {
            title: `${user.userId} 사용자를 탈퇴 처리할까요?`,
            description: "계정이 비활성화되며 로그인할 수 없게 됩니다.",
            confirmText: "탈퇴 처리",
            tone: "danger",
          }
    );
    if (ok) {
      updateStatus({ userId, enabled: next });
    }
  };

  return (
    // closeOnInteractOutside=false: 모달을 여는 행 클릭이 outside-click 으로 오인돼
    // 즉시 닫히는 문제 방지 + 권한 편집 중 실수로 닫힘 방지 (닫기는 X·닫기 버튼·ESC)
    <Dialog.Root
      open={isOpen}
      onOpenChange={(e: any) => !e.open && onClose()}
      closeOnInteractOutside={false}
    >
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.700" />
        <Dialog.Positioner>
        <Dialog.Content maxW="2xl" maxH="88vh" overflowY="auto" {...chakraDark.dialogContent}>
          <Dialog.Header borderBottomWidth="1px" borderColor={t.color.border} pb={3}>
            <Dialog.Title fontSize="xl" fontWeight="bold" fontFamily={t.font.serif} color={t.color.text}>
              사용자 상세
            </Dialog.Title>
          </Dialog.Header>

          <Dialog.Body mt={5}>
            {isLoading || !data ? (
              <HStack justify="center" py={16}>
                <Spinner size="lg" color={t.color.accent} />
              </HStack>
            ) : (
              <VStack align="stretch" gap={6}>
                {/* 기본 정보 */}
                <HStack gap={4} align="start">
                  {user?.src ? (
                    <Image src={user.src} alt="" boxSize="64px" borderRadius="full" objectFit="cover" />
                  ) : (
                    <Box
                      boxSize="64px"
                      borderRadius="full"
                      bg={t.color.surface3}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      color={t.color.textFaint}
                      fontSize="xl"
                      fontFamily={t.font.serif}
                    >
                      {(user?.name || user?.userId || "?").charAt(0).toUpperCase()}
                    </Box>
                  )}
                  <VStack align="start" gap={1} flex={1}>
                    <HStack gap={2}>
                      <Text fontSize="lg" fontWeight="bold" color={t.color.text}>
                        {user?.name || user?.userId}
                      </Text>
                      <Badge
                        bg={user?.enabled ? t.color.badgeBg : "rgba(180, 60, 60, 0.18)"}
                        color={user?.enabled ? t.color.badgeText : "#eaa"}
                        borderRadius={t.radius.pill}
                        px={2.5}
                      >
                        {user?.enabled ? "활성" : "탈퇴"}
                      </Badge>
                      {user?.roles?.includes("admin") && (
                        <Badge
                          bg="transparent"
                          borderWidth="1px"
                          borderColor={t.color.accent}
                          color={t.color.accent}
                          borderRadius={t.radius.pill}
                          px={2.5}
                        >
                          관리자
                        </Badge>
                      )}
                    </HStack>
                    <Text fontSize="sm" color={t.color.textMuted}>
                      @{user?.userId} · {user?.email || "이메일 없음"}
                    </Text>
                    <Text fontSize="xs" color={t.color.textFaint}>
                      가입일 {user?.created ? moment(user.created).format("YYYY.MM.DD HH:mm") : "-"}
                    </Text>
                  </VStack>
                </HStack>

                {/* 권한 관리 */}
                <Box borderWidth="1px" borderColor={t.color.border} borderRadius={t.radius.lg} p={4}>
                  <HStack justify="space-between" flexWrap="wrap" gap={3}>
                    <HStack gap={2}>
                      <Shield size={16} color={t.color.accent} />
                      <VStack align="start" gap={0}>
                        <Text fontSize="sm" fontWeight="semibold" color={t.color.text}>
                          관리자 권한
                        </Text>
                        <Text fontSize="xs" color={t.color.textMuted}>
                          {isSelf
                            ? "본인의 권한은 변경할 수 없습니다"
                            : "관리자 메뉴 접근 권한을 부여합니다"}
                        </Text>
                      </VStack>
                    </HStack>
                    <HStack gap={3}>
                      <Switch.Root
                        checked={isAdmin}
                        disabled={isSelf}
                        onCheckedChange={(e: any) => setIsAdmin(e.checked)}
                        colorPalette="green"
                      >
                        <Switch.HiddenInput />
                        <Switch.Control />
                      </Switch.Root>
                      {roleDirty && (
                        <Button
                          size="xs"
                          {...chakraDark.primaryBtn}
                          onClick={handleSaveRoles}
                          loading={isSavingRoles}
                        >
                          <Save size={13} />
                          저장
                        </Button>
                      )}
                    </HStack>
                  </HStack>
                </Box>

                {/* 작성한 글 */}
                <Box>
                  <HStack gap={2} mb={3}>
                    <FileText size={16} color={t.color.accent} />
                    <Text fontSize="sm" fontWeight="semibold" color={t.color.text}>
                      작성한 글
                    </Text>
                    <Badge bg={t.color.surface3} color={t.color.textSoft} borderRadius={t.radius.pill} px={2}>
                      {data.documentCount}
                    </Badge>
                  </HStack>
                  {data.documents.length === 0 ? (
                    <Text fontSize="sm" color={t.color.textFaint} py={2}>
                      작성한 글이 없습니다.
                    </Text>
                  ) : (
                    <VStack align="stretch" gap={2}>
                      {data.documents.map((doc) => (
                        <DocumentRow key={doc.id} doc={doc} />
                      ))}
                    </VStack>
                  )}
                  {data.documentTotalPages > 1 && (
                    <HStack justify="center" mt={3} gap={3}>
                      <Button
                        size="xs"
                        {...chakraDark.ghostBtn}
                        disabled={docPage <= 0}
                        onClick={() => setDocPage((p) => p - 1)}
                      >
                        이전
                      </Button>
                      <Text fontSize="xs" color={t.color.textMuted}>
                        {docPage + 1} / {data.documentTotalPages}
                      </Text>
                      <Button
                        size="xs"
                        {...chakraDark.ghostBtn}
                        disabled={docPage + 1 >= data.documentTotalPages}
                        onClick={() => setDocPage((p) => p + 1)}
                      >
                        다음
                      </Button>
                    </HStack>
                  )}
                </Box>

                {/* 여행 프로젝트 */}
                <Box>
                  <HStack gap={2} mb={3}>
                    <Map size={16} color={t.color.accent} />
                    <Text fontSize="sm" fontWeight="semibold" color={t.color.text}>
                      여행 프로젝트
                    </Text>
                    <Badge bg={t.color.surface3} color={t.color.textSoft} borderRadius={t.radius.pill} px={2}>
                      {data.travelCount}
                    </Badge>
                  </HStack>
                  {data.travels.length === 0 ? (
                    <Text fontSize="sm" color={t.color.textFaint} py={2}>
                      참여 중인 여행 프로젝트가 없습니다.
                    </Text>
                  ) : (
                    <VStack align="stretch" gap={2}>
                      {data.travels.map((travel) => (
                        <TravelRow key={travel.id} travel={travel} />
                      ))}
                    </VStack>
                  )}
                </Box>
              </VStack>
            )}
          </Dialog.Body>

          <Dialog.Footer mt={5} borderTopWidth="1px" borderColor={t.color.border} pt={3}>
            <HStack w="full" justify="space-between">
              {user && !isSelf ? (
                user.enabled ? (
                  <Button
                    size="sm"
                    variant="outline"
                    borderColor="rgba(221, 153, 153, 0.35)"
                    color="#d99"
                    borderRadius={t.radius.pill}
                    _hover={{ bg: "rgba(180, 60, 60, 0.14)", color: "#eaa" }}
                    onClick={handleToggleStatus}
                    loading={isSavingStatus}
                  >
                    <UserX size={15} />
                    탈퇴 처리
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    {...chakraDark.ghostBtn}
                    borderWidth="1px"
                    borderColor={t.color.border2}
                    onClick={handleToggleStatus}
                    loading={isSavingStatus}
                  >
                    <RotateCcw size={15} />
                    계정 복구
                  </Button>
                )
              ) : (
                <Box />
              )}
              <Button size="sm" {...chakraDark.ghostBtn} onClick={onClose}>
                닫기
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

export default UserDetailModal;
