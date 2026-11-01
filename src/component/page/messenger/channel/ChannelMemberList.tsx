// src/component/page/messenger/channel/ChannelMemberList.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  IconButton,
  Input,
  Button,
  Badge,
  Heading,
  Separator,
  createToaster
} from '@chakra-ui/react';
import {
  X,
  Search,
  UserPlus,
  Circle,
  Bell,
  BellOff
} from 'lucide-react';
import { useAtom } from 'jotai';
import { selectedChannelAtom } from '../../../../stores/messengerStore/messengerStore';
import {
  useChannelMembers,
  useOnlineMembers,
  useRemoveMember, useUpdateMemberRole,
  useUpdateMyNickname,
  useUpdateNotificationSettings
} from '../../../../hooks/useMessengerQueries';
import MemberItem from "./MemberItems";
import InviteUserModal from "./InviteUserModal";
import TravelInviteModal from "./TravelInviteModal";
import {useCurrentUser} from "../../../../hooks/useCurrentUser";
import { confirmDialog } from "../../../../common/elements/ConfirmDialog";

const toaster = createToaster({
  placement: 'top-right',
});

interface ChannelMemberListProps {
  channelId: string;
  isVisible: boolean;
  onClose: () => void;
  currentUserId: string;
  travelId?: string; // Travel 채널인 경우 프로젝트 멤버만 초대 가능
  travelChannelId?: string; // Travel 채널 브릿지 ID
}

export default function ChannelMemberList({
                                            channelId,
                                            isVisible,
                                            onClose,
                                            currentUserId,
                                            travelId,
                                            travelChannelId,
                                          }: ChannelMemberListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [editingNickname, setEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedChannel] = useAtom(selectedChannelAtom);
  const {data : currentUser} = useCurrentUser();
  
  // Fetch actual data
  const { data: members = [], isLoading, refetch: refetchMembers } = useChannelMembers(channelId);
  const { data: onlineMembers = [] } = useOnlineMembers(channelId);
  
  // Mutations
  const removeMemberMutation = useRemoveMember();
  const updateNicknameMutation = useUpdateMyNickname();
  const updateNotificationMutation = useUpdateNotificationSettings();
  const updateMemberRoleMutation = useUpdateMemberRole();
  
  // Find current user's member info
  const currentUserMember = members.find(m => m.userId === currentUser?.id);
  const currentUserRole = currentUserMember?.roleId || "MEMBER";
  
  // Refresh member list when invite modal closes
  const handleInviteModalClose = () => {
    setShowInviteModal(false);
    refetchMembers();
  };
  
  // Create online status map
  const onlineMemberIds = new Set(onlineMembers.map(m => m.userId));
  
  // Filter and sort members
  const filteredMembers = members.filter(member =>
    (member.nickname || member.userId || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Group by status
  const activeMembersOnline = filteredMembers.filter(m =>
    m.status === 'ACTIVE' && onlineMemberIds.has(m.userId)
  );
  
  const activeMembersOffline = filteredMembers.filter(m =>
    m.status === 'ACTIVE' && !onlineMemberIds.has(m.userId)
  );
  
  const inactiveMembers = filteredMembers.filter(m =>
    m.status === 'INACTIVE' || m.status === 'LEFT'
  );
  
  const bannedMembers = filteredMembers.filter(m => m.status === 'BANNED');
  
  const handleMemberClick = (memberId: string) => {
    setSelectedMember(selectedMember === memberId ? null : memberId);
  };
  
  const handleInviteMember = () => {
    setShowInviteModal(true);
  };
  
  const handleRemoveMember = async (userId: string) => {
    const ok = await confirmDialog({
      title: "Remove this member?",
      confirmText: "Remove",
      cancelText: "Cancel",
      tone: "danger",
    });
    if (ok) {
      try {
        await removeMemberMutation.mutateAsync({ channelId, userId });
        toaster.create({
          title: 'Member Removed',
          status: 'success',
          duration: 2000
        });
        refetchMembers();
      } catch (error) {
        toaster.create({
          title: 'Failed to Remove Member',
          status: 'error',
          duration: 2000
        });
      }
    }
  };
  
  const handleTransferOwnership = async (targetUserId: string) => {
    try {
      if (!selectedChannel?.id) {
        toaster.create(
          {
            title: 'Select Channel First',
            status: 'error',
            duration: 2000
          }
        );
        return;
      }
      await updateMemberRoleMutation.mutateAsync({
        channelId : selectedChannel!.id,
        userId : targetUserId,
        roleId : "OWNER"
      })
      
      toaster.create({
        title : "Owner Role Transferred Successfully",
        status  :"success",
        duration : 2000
      })
      await refetchMembers();
    } catch (error) {
      toaster.create({
        title : "Failed to Transfer Role",
        status : "error",
        duration : 2000
      })
    }
  }
  
  const handleUpdateNickname = async () => {
    if (!newNickname.trim()) return;
    
    try {
      await updateNicknameMutation.mutateAsync({
        channelId,
        nickname: newNickname
      });
      setEditingNickname(false);
      setNewNickname('');
      toaster.create({
        title: 'Nickname Updated',
        status: 'success',
        duration: 2000
      });
      refetchMembers();
    } catch (error) {
      toaster.create({
        title: 'Failed to Update Nickname',
        status: 'error',
        duration: 2000
      });
    }
  };
  
  const handleToggleNotifications = async (member: any) => {
    try {
      const newLevel = member.notificationLevel === 'NONE' ? 'ALL' :
        member.notificationLevel === 'ALL' ? 'MENTIONS_ONLY' : 'NONE';
      
      await updateNotificationMutation.mutateAsync({
        channelId,
        level: newLevel,
        enabled: newLevel !== 'NONE'
      });
      
      toaster.create({
        title: 'Notification Settings Updated',
        status: 'success',
        duration: 2000
      });
      refetchMembers();
    } catch (error) {
      toaster.create({
        title: 'Failed to Update Notification Settings',
        status: 'error',
        duration: 2000
      });
    }
  };
  
  const getMemberStatusBadge = (status: string) => {
    switch(status) {
      case 'BANNED':
        return (
          <Badge size="xs" colorPalette="red" variant="subtle">
            Banned
          </Badge>
        );
      case 'LEFT':
        return (
          <Badge size="xs" colorPalette="gray" variant="subtle">
            Left
          </Badge>
        );
      case 'INACTIVE':
        return (
          <Badge size="xs" colorPalette="yellow" variant="subtle">
            Inactive
          </Badge>
        );
      case 'PENDING_APPROVAL':
        return (
          <Badge size="xs" colorPalette="blue" variant="subtle">
            Pending
          </Badge>
        );
      default:
        return null;
    }
  };
  
  const getNotificationIcon = (level: string) => {
    switch(level) {
      case 'ALL':
        return <Bell size={14} className="text-green-500" />;
      case 'MENTIONS_ONLY':
        return <Bell size={14} className="text-yellow-500" />;
      case 'NONE':
        return <BellOff size={14} className="text-gray-400" />;
      default:
        return <Bell size={14} />;
    }
  };
  
  const formatLastSeen = (dateString: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US');
  };
  
  if (!isVisible) return null;

  return (
    <>
      <Box
        position="absolute"
        right={0}
        top={0}
        h="100%"
        w="320px"
        bg="#0f1414"
        borderLeft="1px solid rgba(255, 255, 255, 0.06)"
        boxShadow="-12px 0 32px rgba(0, 0, 0, 0.35)"
        zIndex={1000}
      >
        <Flex direction="column" h="full">
          {/* Header */}
          <Flex
            align="center"
            justify="space-between"
            px={4}
            borderBottom="1px solid rgba(255, 255, 255, 0.06)"
            bg="#0f1414"
            height="4rem"
            flexShrink={0}
          >
            <Heading
              size="sm"
              fontWeight={600}
              letterSpacing="-0.01em"
              style={{ color: "#ffffff" }}
            >
              Channel Members
            </Heading>
            <HStack gap={1}>
              <Button
                size="xs"
                variant="ghost"
                onClick={handleInviteMember}
                style={{
                  color: "#7fb89a",
                  background: "rgba(46, 87, 62, 0.18)",
                  border: "1px solid rgba(80, 107, 92, 0.45)",
                  borderRadius: "8px",
                  padding: "0 10px",
                  height: "30px",
                }}
              >
                <UserPlus size={14} />
                <Text as="span" ml={1} fontSize="xs" fontWeight={500}>
                  Invite
                </Text>
              </Button>
              <IconButton
                size="sm"
                variant="ghost"
                onClick={onClose}
                aria-label="Close"
                style={{ color: "#c7d2cc" }}
              >
                <X size={18} />
              </IconButton>
            </HStack>
          </Flex>

          {/* Search */}
          <Box px={4} pt={3} pb={2} flexShrink={0}>
            <Flex
              align="center"
              gap={2}
              px={3}
              h="36px"
              bg="#14191a"
              border="1px solid rgba(255, 255, 255, 0.08)"
              borderRadius="10px"
              transition="border-color 0.15s, box-shadow 0.15s"
              _focusWithin={{
                borderColor: "rgba(80, 107, 92, 0.65)",
                boxShadow: "0 0 0 3px rgba(46, 87, 62, 0.18)",
              }}
            >
              <Search size={14} color="#94a3a0" />
              <Input
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                variant="outline"
                border="none"
                outline="none"
                p={0}
                h="auto"
                fontSize="sm"
                color="#ffffff"
                _placeholder={{ color: "#6f7a76" }}
                _focus={{ boxShadow: "none", outline: "none" }}
              />
            </Flex>
          </Box>

          {/* Member Statistics */}
          <HStack px={4} pb={3} gap={4} flexShrink={0}>
            <Text fontSize="xs" style={{ color: "#94a3a0" }}>
              Total{" "}
              <Text as="span" fontWeight={600} style={{ color: "#c7d2cc" }}>
                {members.length}
              </Text>
            </Text>
            <HStack gap={1.5}>
              <Box
                w="8px"
                h="8px"
                borderRadius="full"
                bg={activeMembersOnline?.length ? "#7fb89a" : "rgba(255,255,255,0.18)"}
                boxShadow={
                  activeMembersOnline?.length
                    ? "0 0 0 2px rgba(127, 184, 154, 0.18)"
                    : "none"
                }
              />
              <Text fontSize="xs" style={{ color: "#94a3a0" }}>
                Online{" "}
                <Text as="span" fontWeight={600} style={{ color: "#c7d2cc" }}>
                  {activeMembersOnline.length}
                </Text>
              </Text>
            </HStack>
          </HStack>

          <Box h="1px" bg="rgba(255, 255, 255, 0.06)" flexShrink={0} />

          {/* Member List */}
          <Box
            flex={1}
            overflowY="auto"
            px={2}
            css={{
              "&::-webkit-scrollbar": { width: "6px" },
              "&::-webkit-scrollbar-track": { background: "transparent" },
              "&::-webkit-scrollbar-thumb": {
                background: "rgba(255, 255, 255, 0.08)",
                borderRadius: "3px",
              },
              "&::-webkit-scrollbar-thumb:hover": {
                background: "rgba(255, 255, 255, 0.16)",
              },
            }}
          >
            {isLoading ? (
              <Flex justify="center" align="center" py={8}>
                <Text fontSize="sm" style={{ color: "#94a3a0" }}>
                  Loading members...
                </Text>
              </Flex>
            ) : (
              <VStack align="stretch" gap={1} py={2}>
                {/* Online Members */}
                {activeMembersOnline.length > 0 && (
                  <>
                    <Text
                      fontSize="10.5px"
                      fontWeight={600}
                      style={{ color: "#6f7a76", letterSpacing: "0.08em" }}
                      textTransform="uppercase"
                      px={3}
                      pt={2}
                      pb={1}
                    >
                      Online — {activeMembersOnline.length}
                    </Text>
                    {activeMembersOnline.map((member) => (
                      <MemberItem
                        key={member.id}
                        member={member}
                        isOnline={true}
                        isSelected={selectedMember === member.id}
                        isCurrentUser={member.userId === currentUser?.id}
                        currentUserRole={currentUserRole}
                        onClick={() => handleMemberClick(member.id)}
                        onRemove={() => handleRemoveMember(member.userId)}
                        onTransferRoleOwner={() => handleTransferOwnership(member.userId)}
                        onToggleNotifications={() => handleToggleNotifications(member)}
                        getMemberStatusBadge={getMemberStatusBadge}
                        getNotificationIcon={getNotificationIcon}
                        formatLastSeen={formatLastSeen}
                      />
                    ))}
                  </>
                )}

                {/* Offline Members */}
                {activeMembersOffline.length > 0 && (
                  <>
                    <Text
                      fontSize="10.5px"
                      fontWeight={600}
                      style={{ color: "#6f7a76", letterSpacing: "0.08em" }}
                      textTransform="uppercase"
                      px={3}
                      pt={3}
                      pb={1}
                    >
                      Offline — {activeMembersOffline.length}
                    </Text>
                    {activeMembersOffline.map((member) => (
                      <MemberItem
                        key={member.id}
                        member={member}
                        isOnline={false}
                        isSelected={selectedMember === member.id}
                        isCurrentUser={member.userId === currentUser?.id}
                        currentUserRole={currentUserRole}
                        onClick={() => handleMemberClick(member.id)}
                        onRemove={() => handleRemoveMember(member.userId)}
                        onTransferRoleOwner={() => handleTransferOwnership(member.userId)}
                        onToggleNotifications={() => handleToggleNotifications(member)}
                        getMemberStatusBadge={getMemberStatusBadge}
                        getNotificationIcon={getNotificationIcon}
                        formatLastSeen={formatLastSeen}
                      />
                    ))}
                  </>
                )}

                {/* Banned Members */}
                {bannedMembers.length > 0 && (
                  <>
                    <Text
                      fontSize="10.5px"
                      fontWeight={600}
                      style={{ color: "#6f7a76", letterSpacing: "0.08em" }}
                      textTransform="uppercase"
                      px={3}
                      pt={3}
                      pb={1}
                    >
                      Banned — {bannedMembers.length}
                    </Text>
                    {bannedMembers.map((member) => (
                      <MemberItem
                        key={member.id}
                        member={member}
                        isOnline={false}
                        isSelected={selectedMember === member.id}
                        isCurrentUser={member.userId === currentUser?.id}
                        currentUserRole={currentUserRole}
                        onClick={() => handleMemberClick(member.id)}
                        onRemove={() => handleRemoveMember(member.userId)}
                        onToggleNotifications={() => handleToggleNotifications(member)}
                        getMemberStatusBadge={getMemberStatusBadge}
                        getNotificationIcon={getNotificationIcon}
                        formatLastSeen={formatLastSeen}
                      />
                    ))}
                  </>
                )}

                {/* No Members */}
                {filteredMembers.length === 0 && (
                  <Flex justify="center" align="center" py={10}>
                    <VStack gap={3}>
                      <Box
                        w="48px"
                        h="48px"
                        borderRadius="full"
                        bg="rgba(46, 87, 62, 0.22)"
                        border="1px solid rgba(80, 107, 92, 0.45)"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        color="#7fb89a"
                      >
                        <UserPlus size={20} />
                      </Box>
                      <Text fontSize="sm" style={{ color: "#c7d2cc" }}>
                        {searchQuery ? "No search results" : "No members in this channel"}
                      </Text>
                      {!searchQuery && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleInviteMember}
                          style={{
                            color: "#ffffff",
                            background: "#2f5743",
                            border: "1px solid rgba(80, 107, 92, 0.55)",
                            borderRadius: "8px",
                            padding: "0 14px",
                          }}
                        >
                          Invite First Member
                        </Button>
                      )}
                    </VStack>
                  </Flex>
                )}
              </VStack>
            )}
          </Box>
        </Flex>
      </Box>
      
      {/* Invite User Modal */}
      {travelId && travelChannelId ? (
        <TravelInviteModal
          isOpen={showInviteModal}
          onClose={handleInviteModalClose}
          travelId={travelId}
          travelChannelId={travelChannelId}
          channelName={selectedChannel?.name || ''}
        />
      ) : (
        <InviteUserModal
          isOpen={showInviteModal}
          onClose={handleInviteModalClose}
          channelId={channelId}
          channelName={selectedChannel?.name || ''}
        />
      )}
    </>
  );
}