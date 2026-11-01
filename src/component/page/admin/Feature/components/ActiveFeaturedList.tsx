import React, { useState } from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  Badge,
  Image,
  IconButton,
  Spinner
} from '@chakra-ui/react';
import {
  Calendar,
  MapPin,
  Edit,
  Trash2,
  Eye,
  AlertCircle
} from 'lucide-react';
import {
  useFeaturedDocuments,
  useRemoveFromFeatured
} from '../../../../../hooks/useFeaturedQueries';
import FeaturedEditModal from './FeaturedEditModal';
import { homeTokens } from '../../adminUi';
import { confirmDialog } from "../../../../../common/elements/ConfirmDialog";

const t = homeTokens;

// 아이콘 버튼 다크 톤 공통 스타일
const ghostIconStyle = {
  color: t.color.textMuted,
  _hover: { color: t.color.text, bg: "whiteAlpha.100" },
} as const;

const ActiveFeaturedList: React.FC = () => {
  const { data: featuredDocs, isLoading, error } = useFeaturedDocuments(10);
  const { mutate: removeFeatured, isPending: isRemoving } = useRemoveFromFeatured();
  const [selectedDoc, setSelectedDoc] = useState<FeaturedDocument | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (isLoading) {
    return (
      <HStack justify="center" align="center" h="64" w="full">
        <Spinner size="xl" color={t.color.accent} />
      </HStack>
    );
  }

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
        <Text>Featured 콘텐츠를 불러오는데 실패했습니다.</Text>
      </HStack>
    );
  }

  if (!featuredDocs || featuredDocs.length === 0) {
    return (
      <VStack
        py={12}
        gap={2}
        borderWidth="1px"
        borderStyle="dashed"
        borderColor={t.color.border2}
        borderRadius={t.radius.lg}
      >
        <Text fontFamily={t.font.serif} fontSize="lg" color={t.color.textSoft}>
          활성 Featured 콘텐츠가 없습니다
        </Text>
        <Text fontSize="sm" color={t.color.textMuted}>
          문서 목록에서 Featured로 설정할 콘텐츠를 선택해주세요
        </Text>
      </VStack>
    );
  }

  const handleRemove = async (id: string) => {
    const ok = await confirmDialog({
      title: "Featured에서 제거할까요?",
      confirmText: "제거",
      tone: "danger",
    });
    if (ok) {
      removeFeatured(id);
    }
  };

  const handleEdit = (doc: FeaturedDocument) => {
    setSelectedDoc(doc);
    setIsEditModalOpen(true);
  };

  const formatDate = (date?: string) => {
    if (!date) return '미설정';
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <VStack gap={4} w="full">
        {featuredDocs.map((doc, index) => (
          <Box
            key={doc.id}
            w="full"
            bg={t.color.surface}
            borderWidth="1px"
            borderColor={t.color.border}
            borderRadius={t.radius.lg}
            overflow="hidden"
            transition="border-color 0.2s ease"
            _hover={{ borderColor: t.color.border2 }}
          >
            <HStack gap={0} h="full" align="stretch">
              {/* Priority */}
              <VStack px={4} justify="center" bg={t.color.surface2}>
                <Text
                  fontFamily={t.font.serif}
                  fontSize="lg"
                  fontWeight="bold"
                  color={t.color.accent}
                >
                  #{index + 1}
                </Text>
              </VStack>

              {/* Thumbnail */}
              {doc.featuredInfo?.featuredImageUrl && (
                <Box position="relative" w="32" h="32" flexShrink={0}>
                  <Image
                    src={doc.featuredInfo.featuredImageUrl}
                    alt={doc.title}
                    w="full"
                    h="full"
                    objectFit="cover"
                  />
                </Box>
              )}

              {/* Content */}
              <VStack flex={1} p={4} gap={2} align="start">
                <HStack w="full" justify="space-between" align="start">
                  <Box flex={1}>
                    <Text
                      fontSize="lg"
                      fontWeight="bold"
                      fontFamily={t.font.serif}
                      color={t.color.text}
                      mb={1}
                    >
                      {doc.featuredInfo?.featuredTitle || doc.title}
                    </Text>
                    {doc.featuredInfo?.featuredSubtitle && (
                      <Text fontSize="sm" color={t.color.textMuted}>
                        {doc.featuredInfo.featuredSubtitle}
                      </Text>
                    )}
                  </Box>

                  <HStack gap={1}>
                    {doc.featuredSchedule?.isActive && (
                      <Badge
                        bg={t.color.badgeBg}
                        color={t.color.badgeText}
                        borderRadius={t.radius.pill}
                        px={2.5}
                      >
                        활성
                      </Badge>
                    )}
                    {doc.draft && (
                      <Badge
                        bg="whiteAlpha.100"
                        color={t.color.textMuted}
                        borderRadius={t.radius.pill}
                        px={2.5}
                      >
                        임시저장
                      </Badge>
                    )}
                  </HStack>
                </HStack>

                {/* Metadata */}
                <HStack flexWrap="wrap" gap={4} fontSize="sm" color={t.color.textFaint}>
                  {doc.featuredInfo?.location && (
                    <HStack gap={1}>
                      <MapPin size={14} />
                      <Text>{doc.featuredInfo.location}</Text>
                    </HStack>
                  )}

                  <HStack gap={1}>
                    <Calendar size={14} />
                    <Text>
                      {formatDate(doc.featuredSchedule?.startDate)} ~ {formatDate(doc.featuredSchedule?.endDate)}
                    </Text>
                  </HStack>
                </HStack>

                {/* Highlights */}
                {doc.featuredInfo?.highlights && doc.featuredInfo.highlights.length > 0 && (
                  <HStack gap={2} flexWrap="wrap">
                    {doc.featuredInfo.highlights.map((highlight, idx) => (
                      <Badge
                        key={idx}
                        bg="transparent"
                        borderWidth="1px"
                        borderColor={t.color.border2}
                        color={t.color.textSoft}
                        borderRadius={t.radius.pill}
                        px={2.5}
                        fontSize="xs"
                      >
                        {highlight}
                      </Badge>
                    ))}
                  </HStack>
                )}
              </VStack>

              {/* Actions */}
              <VStack p={4} gap={2} borderLeftWidth="1px" borderColor={t.color.border} justify="center">
                <IconButton
                  aria-label="View"
                  size="sm"
                  variant="ghost"
                  {...ghostIconStyle}
                  onClick={() => window.open(`/blog/view/${doc.id}`, '_blank')}
                >
                  <Eye size={16} />
                </IconButton>

                <IconButton
                  aria-label="Edit"
                  size="sm"
                  variant="ghost"
                  {...ghostIconStyle}
                  onClick={() => handleEdit(doc)}
                >
                  <Edit size={16} />
                </IconButton>

                <IconButton
                  aria-label="Remove"
                  size="sm"
                  variant="ghost"
                  color="#d99"
                  _hover={{ color: "#eaa", bg: "rgba(180, 60, 60, 0.14)" }}
                  onClick={() => handleRemove(doc.id!)}
                  loading={isRemoving}
                >
                  <Trash2 size={16} />
                </IconButton>
              </VStack>
            </HStack>
          </Box>
        ))}
      </VStack>

      {/* Edit Modal */}
      {selectedDoc && (
        <FeaturedEditModal
          document={selectedDoc}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedDoc(null);
          }}
        />
      )}
    </>
  );
};

export default ActiveFeaturedList;
