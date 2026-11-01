// src/component/page/messenger/message/MessageItem.tsx
import React, {memo, useState} from 'react';
import { useAtom } from 'jotai';
import {
  Box,
  Flex,
  HStack,
  VStack,
  Text,
  Image,
  Button,
  IconButton,
  Badge,
  Menu,
  MenuContent,
  MenuTrigger,
  MenuItem,
  Textarea,
  createToaster,
  Portal
} from '@chakra-ui/react';
import {
  Download,
  Edit,
  Trash2,
  Star,
  Forward,
  Reply,
  Smile,
  Pin,
  MoreVertical,
  File,
  Check,
  CheckCheck
} from 'lucide-react';

// Types
import { Message } from '../../../../types/messenger/messengerTypes';

// Store
import {
  currentUserAtom,
  contextMenuAtom
} from '../../../../stores/messengerStore/messengerStore';

// Hooks
import {
  useAddReaction,
  usePinMessage,
  useDeleteMessage,
  useUpdateMessage
} from '../../../../hooks/useMessengerQueries';
import { confirmDialog } from "../../../../common/elements/ConfirmDialog";

interface MessageItemProps {
  message: Message;
}

const toaster = createToaster({
  placement: "top",
});

const MessageItem: React.FC<MessageItemProps> = memo(({ message }) => {
  const [currentUser] = useAtom(currentUserAtom);
  const [, setContextMenu] = useAtom(contextMenuAtom);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.message);
  const [showReactions, setShowReactions] = useState(false);
  
  // Mutations
  const addReactionMutation = useAddReaction();
  const pinMessageMutation = usePinMessage();
  const deleteMessageMutation = useDeleteMessage();
  const updateMessageMutation = useUpdateMessage();
  
  const isMyMessage = message.isMyMessage;
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };
  
  const handleReaction = (emoji: string) => {
    addReactionMutation.mutate({
      messageId: message.id,
      data: { emoji, isAdd: true }
    });
  };
  
  const handlePin = () => {
    pinMessageMutation.mutate({
      messageId: message.id,
      pin: !message.isPinned
    });
  };
  
  const handleDelete = async () => {
    const ok = await confirmDialog({
      title: "메시지를 삭제할까요?",
      confirmText: "삭제",
      tone: "danger",
    });
    if (ok) {
      deleteMessageMutation.mutate(message.id, {
        onSuccess: () => {
          toaster.create({
            title: '메시지가 삭제되었습니다',
            status: 'success',
            duration: 2000
          });
        }
      });
    }
  };
  
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  const handleSaveEdit = () => {
    if (editText.trim() !== message.message) {
      updateMessageMutation.mutate({
        messageId: message.id,
        data: { message: editText.trim() }
      }, {
        onSuccess: () => {
          setIsEditing(false);
          toaster.create({
            title: '메시지가 수정되었습니다',
            status: 'success',
            duration: 2000
          });
        }
      });
    } else {
      setIsEditing(false);
    }
  };
  
  const handleCancelEdit = () => {
    setEditText(message.message);
    setIsEditing(false);
  };
  
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      message
    });
  };
  
  const renderAttachment = (attachment: any) => {
    const isImage = attachment.mimeType?.startsWith('image/');
    const isVideo = attachment.mimeType?.startsWith('video/');
    const isAudio = attachment.mimeType?.startsWith('audio/');
    
    if (isImage) {
      return (
        <Image
          src={attachment.fileUrl}
          alt={attachment.fileName}
          maxW="300px"
          maxH="200px"
          borderRadius="md"
          cursor="pointer"
          onClick={() => window.open(attachment.fileUrl, '_blank')}
        />
      );
    }
    
    if (isVideo) {
      return (
        <Box maxW="300px" maxH="200px" borderRadius="md">
          <video
            controls
            style={{ width: '100%', height: '100%', borderRadius: '6px' }}
            src={attachment.fileUrl}
          />
        </Box>
      );
    }
    
    if (isAudio) {
      return (
        <Box w="250px">
          <audio controls style={{ width: '100%' }} src={attachment.fileUrl} />
        </Box>
      );
    }
    
    // 일반 파일
    return (
      <Box
        p={3}
        bg={isMyMessage ? "rgba(46, 87, 62, 0.22)" : "#14191a"}
        borderRadius="10px"
        border="1px solid"
        borderColor={isMyMessage ? "rgba(80, 107, 92, 0.45)" : "rgba(255, 255, 255, 0.08)"}
        maxW="250px"
      >
        <HStack gap={3}>
          <Box style={{ color: isMyMessage ? "#7fb89a" : "#94a3a0" }}>
            <File size={24} />
          </Box>
          <VStack align="start" gap={0} flex={1} minW={0}>
            <Text fontSize="sm" fontWeight="medium" truncate style={{ color: "#ffffff" }}>
              {attachment.fileName}
            </Text>
            <Text fontSize="xs" style={{ color: "#94a3a0" }}>
              {attachment.fileSize ? (attachment.fileSize / 1024 / 1024).toFixed(2) + ' MB' : ''}
            </Text>
          </VStack>
          <IconButton
            aria-label="다운로드"
            size="sm"
            variant="ghost"
            onClick={() => window.open(attachment.fileUrl, '_blank')}
            style={{ color: "#c7d2cc" }}
          >
            <Download size={16} />
          </IconButton>
        </HStack>
      </Box>
    );
  };
  
  return (
    <Box
      py={2}
      px={4}
      _hover={{ bg: 'rgba(255, 255, 255, 0.025)' }}
      position="relative"
      className="group"
    >
      <Flex
        w="100%"
        justify={isMyMessage ? 'flex-end' : 'flex-start'}
        align="flex-start"
      >
        <HStack
          align="flex-start"
          gap={3}
          maxW="70%"
          flexDirection={isMyMessage ? 'row-reverse' : 'row'}
        >
          {/* 아바타 - 상대방 메시지일 때만 표시 */}
          {!isMyMessage && (
            <Box
              w={8}
              h={8}
              borderRadius="full"
              // bg="gradient-to-br from-blue-400 to-purple-500"
              border={"1px solid #dedede"}
              color="black"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="sm"
              fontWeight="bold"
              flexShrink={0}
            >
              {message.userAvatarUrl ? (
                <Image
                  src={message.userAvatarUrl}
                  alt={message.userNickname || message.userId}
                  w="full"
                  h="full"
                  borderRadius="full"
                  objectFit="cover"
                />
              ) : (
                (message.userNickname || message.userId).charAt(0).toUpperCase()
              )}
            </Box>
          )}
          
          {/* 메시지 내용 컨테이너 */}
          <VStack
            align={isMyMessage ? 'flex-end' : 'flex-start'}
            gap={1}
            flex={1}
          >
            {/* 사용자 이름 - 상대방 메시지일 때만 표시 */}
            {!isMyMessage && (
              <Text fontSize="sm" fontWeight="semibold" style={{ color: "#c7d2cc" }} px={1}>
                {message.userNickname || message.userId}
              </Text>
            )}

            {/* 메시지 버블 */}
            <Box
              bg={isMyMessage ? '#2f5743' : '#14191a'}
              color={isMyMessage ? '#ffffff' : '#e8eaeb'}
              px={4}
              py={2}
              borderRadius={isMyMessage ? '18px 18px 4px 18px' : '18px 18px 18px 4px'}
              border="1px solid"
              borderColor={isMyMessage ? 'rgba(80, 107, 92, 0.55)' : 'rgba(255, 255, 255, 0.08)'}
              shadow={isMyMessage ? 'md' : 'sm'}
              position="relative"
              onContextMenu={handleContextMenu}
              maxW="100%"
              wordBreak="break-word"
            >
              {/* 고정 표시 */}
              {message.isPinned && (
                <Box
                  position="absolute"
                  top="-8px"
                  right="-8px"
                  bg="amber.100"
                  borderRadius="full"
                  p={1}
                  shadow="sm"
                >
                  <Pin size={12} color="#f59e0b" />
                </Box>
              )}
              
              {/* 메시지 텍스트 */}
              {isEditing ? (
                <VStack gap={2} align="stretch">
                  <Textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    minH="60px"
                    resize="vertical"
                    bg="#0f1414"
                    border="1px solid rgba(255, 255, 255, 0.08)"
                    borderRadius="8px"
                    style={{ color: "#ffffff" }}
                    _focus={{ borderColor: "rgba(80, 107, 92, 0.65)", boxShadow: "0 0 0 3px rgba(46, 87, 62, 0.18)" }}
                  />
                  <HStack gap={2}>
                    <Button
                      size="xs"
                      onClick={handleSaveEdit}
                      style={{
                        background: "#2f5743",
                        color: "#ffffff",
                        border: "1px solid rgba(80, 107, 92, 0.55)",
                        borderRadius: "6px",
                      }}
                    >
                      저장
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={handleCancelEdit}
                      style={{ color: "#c7d2cc" }}
                    >
                      취소
                    </Button>
                  </HStack>
                </VStack>
              ) : (
                <Text fontSize="sm" lineHeight="1.5" whiteSpace="pre-wrap">
                  {message.message}
                </Text>
              )}
              
              {/* 수정 표시 */}
              {message.isEdited && !isEditing && (
                <Text
                  fontSize="xs"
                  style={{ color: isMyMessage ? "rgba(255,255,255,0.65)" : "#94a3a0" }}
                  mt={1}
                  fontStyle="italic"
                >
                  (편집됨)
                </Text>
              )}
            </Box>

            {/* 시간 및 읽음 표시 */}
            <HStack gap={1} px={1}>
              <Text fontSize="xs" style={{ color: "#94a3a0" }}>
                {formatTime(message.createdAt)}
              </Text>
              {isMyMessage && (
                <Box style={{ color: message.status === 'READ' ? "#7fb89a" : "#94a3a0" }}>
                  {message.status === 'READ' ? (
                    <CheckCheck size={14} />
                  ) : (
                    <Check size={14} />
                  )}
                </Box>
              )}
            </HStack>
            
            {/* 첨부파일 */}
            {message.attachments && message.attachments.length > 0 && (
              <VStack gap={2} align={isMyMessage ? 'flex-end' : 'flex-start'} mt={1}>
                {message.attachments.map((attachment, index) => (
                  <Box key={index}>
                    {renderAttachment(attachment)}
                  </Box>
                ))}
              </VStack>
            )}
            
            {/* 반응 */}
            {message.reactions && message.reactions.length > 0 && (
              <HStack gap={1} flexWrap="wrap" mt={1}>
                {message.reactions.map((reaction, index) => (
                  <Button
                    key={index}
                    size="xs"
                    variant={reaction.isMyReaction ? "solid" : "outline"}
                    colorScheme={reaction.isMyReaction ? "blue" : "gray"}
                    borderRadius="full"
                    fontSize="xs"
                    px={2}
                    py={1}
                    minH="auto"
                    onClick={() => handleReaction(reaction.emoji)}
                  >
                    {reaction.emoji} {reaction.count}
                  </Button>
                ))}
              </HStack>
            )}
          </VStack>
        </HStack>
        
        {/* 호버 시 액션 버튼들 */}
        <HStack
          gap={0.5}
          position="absolute"
          top={1}
          right={isMyMessage ? 'auto' : 4}
          left={isMyMessage ? 4 : 'auto'}
          opacity={0}
          _groupHover={{ opacity: 1 }}
          transition="opacity 0.2s"
          bg="#14191a"
          border="1px solid rgba(255, 255, 255, 0.08)"
          boxShadow="0 4px 16px rgba(0, 0, 0, 0.45)"
          borderRadius="10px"
          p={1}
          zIndex={5}
        >
          {/* 반응 추가 버튼 */}
          <IconButton
            aria-label="반응 추가"
            size="xs"
            variant="ghost"
            onClick={() => setShowReactions(!showReactions)}
            title="반응 추가"
            style={{ color: "#c7d2cc" }}
          >
            <Smile size={14} />
          </IconButton>

          {/* 답글 버튼 */}
          <IconButton
            aria-label="답글"
            size="xs"
            variant="ghost"
            title="답글"
            style={{ color: "#c7d2cc" }}
          >
            <Reply size={14} />
          </IconButton>

          {/* 내 메시지인 경우에만 편집/삭제 버튼 */}
          {isMyMessage && (
            <>
              <IconButton
                aria-label="수정"
                size="xs"
                variant="ghost"
                onClick={handleEdit}
                title="수정"
                style={{ color: "#c7d2cc" }}
              >
                <Edit size={14} />
              </IconButton>

              <IconButton
                aria-label="삭제"
                size="xs"
                variant="ghost"
                onClick={handleDelete}
                title="삭제"
                style={{ color: "#e58a8a" }}
              >
                <Trash2 size={14} />
              </IconButton>
            </>
          )}

          {/* 더보기 메뉴 */}
          <Menu.Root>
            <MenuTrigger asChild>
              <IconButton
                aria-label="더보기"
                size="xs"
                variant="ghost"
                title="더보기"
                style={{ color: "#c7d2cc" }}
              >
                <MoreVertical size={14} />
              </IconButton>
            </MenuTrigger>
            <Portal>
              <Menu.Positioner>
                <MenuContent>
                  <MenuItem onClick={handlePin}>
                    <HStack gap={2}>
                      <Pin size={16} />
                      <Text>{message.isPinned ? '고정 해제' : '고정'}</Text>
                    </HStack>
                  </MenuItem>
                  <MenuItem>
                    {/*<HStack gap={2}>*/}
                    {/*  <Star size={16} />*/}
                    {/*  <Text>즐겨찾기</Text>*/}
                    {/*</HStack>*/}
                  </MenuItem>
                  <MenuItem>
                    <HStack gap={2}>
                      <Forward size={16} />
                      <Text>전달</Text>
                    </HStack>
                  </MenuItem>
                </MenuContent>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
        </HStack>
      </Flex>
      
      {/* 빠른 반응 선택 */}
      {showReactions && (
        <Box
          position="absolute"
          top="100%"
          left={isMyMessage ? 'auto' : '50%'}
          right={isMyMessage ? '10%' : 'auto'}
          transform={isMyMessage ? 'none' : 'translateX(-50%)'}
          bg="#14191a"
          boxShadow="0 8px 24px rgba(0, 0, 0, 0.5)"
          borderRadius="full"
          p={1.5}
          zIndex={10}
          border="1px solid rgba(255, 255, 255, 0.08)"
          mt={2}
        >
          <HStack gap={1}>
            {['👍', '❤️', '😂', '😮', '😢', '😡'].map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                fontSize="lg"
                borderRadius="full"
                w={8}
                h={8}
                p={0}
                onClick={() => {
                  handleReaction(emoji);
                  setShowReactions(false);
                }}
                _hover={{ bg: 'rgba(255, 255, 255, 0.06)' }}
              >
                {emoji}
              </Button>
            ))}
          </HStack>
        </Box>
      )}
    </Box>
  );
}, (prevProps, nextProps) => {
  // 메시지 ID와 주요 속성이 같으면 재렌더링 방지
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.message === nextProps.message.message &&
    prevProps.message.isEdited === nextProps.message.isEdited &&
    prevProps.message.isPinned === nextProps.message.isPinned
  );
});

export default MessageItem;