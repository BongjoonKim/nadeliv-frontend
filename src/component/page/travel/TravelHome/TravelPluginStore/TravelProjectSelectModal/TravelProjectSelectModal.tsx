import React from "react";
import styled, { keyframes } from "styled-components";
import { X, Search, MapPin, Calendar, Users } from "lucide-react";
import { TravelResponse } from "../../../../../../types/travel/travelTypes";
import { TravelPluginDefinition } from "../../../../../../types/travel/travelPluginTypes";
import TravelProjectThumb from "../../../common/TravelProjectThumb";

interface TravelProjectSelectModalProps {
  isOpen: boolean;
  isLoading: boolean;
  searchQuery: string;
  selectedProject: TravelResponse | null;
  targetPlugin: TravelPluginDefinition | null;
  filteredTravels: TravelResponse[];
  onSearchChange: (query: string) => void;
  onSelectProject: (project: TravelResponse) => void;
  onApply: () => void;
  onClose: () => void;
}

const TravelProjectSelectModal: React.FC<TravelProjectSelectModalProps> = ({
  isOpen,
  isLoading,
  searchQuery,
  selectedProject,
  targetPlugin,
  filteredTravels,
  onSearchChange,
  onSelectProject,
  onApply,
  onClose,
}) => {
  if (!isOpen || !targetPlugin) return null;

  const PluginIcon = targetPlugin.icon;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  };

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <ModalHeader>
          <HeaderLeft>
            <PluginIconWrap style={{ background: `${targetPlugin.color}15` }}>
              <PluginIcon size={18} color={targetPlugin.color} />
            </PluginIconWrap>
            <div>
              <ModalTitle>{targetPlugin.name}</ModalTitle>
              <ModalSubtitle>Select a project to connect</ModalSubtitle>
            </div>
          </HeaderLeft>
          <CloseButton onClick={onClose}>
            <X size={18} />
          </CloseButton>
        </ModalHeader>

        {/* 검색 */}
        <SearchWrap>
          <Search size={16} className="search-icon" />
          <SearchInput
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search projects..."
            autoFocus
          />
        </SearchWrap>

        {/* 프로젝트 목록 */}
        <ProjectList>
          {isLoading && (
            <>
              {[1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </>
          )}

          {!isLoading && filteredTravels.length === 0 && (
            <EmptyState>
              <MapPin size={32} color="#c7c7d5" />
              <EmptyText>
                {searchQuery ? "No projects found" : "No travel projects yet"}
              </EmptyText>
              <EmptyDesc>
                {searchQuery
                  ? "Try a different search term"
                  : "Create a travel project first to use this plugin"}
              </EmptyDesc>
            </EmptyState>
          )}

          {!isLoading &&
            filteredTravels.map((project, i) => (
              <ProjectCard
                key={project.id}
                $selected={selectedProject?.id === project.id}
                $index={i}
                onClick={() => onSelectProject(project)}
              >
                <ProjectAvatar>
                  <TravelProjectThumb
                    seed={project.id}
                    src={project.coverImageUrl}
                    alt={project.title}
                  />
                </ProjectAvatar>

                <ProjectInfo>
                  <ProjectName>{project.title}</ProjectName>
                  <ProjectMeta>
                    {project.destination && (
                      <MetaItem>
                        <MapPin size={12} />
                        {project.destination}
                      </MetaItem>
                    )}
                    {project.startDate && (
                      <MetaItem>
                        <Calendar size={12} />
                        {formatDate(project.startDate)}
                      </MetaItem>
                    )}
                    {project.memberCount !== undefined && project.memberCount > 0 && (
                      <MetaItem>
                        <Users size={12} />
                        {project.memberCount}
                      </MetaItem>
                    )}
                  </ProjectMeta>
                </ProjectInfo>

                <SelectIndicator $selected={selectedProject?.id === project.id}>
                  {selectedProject?.id === project.id && (
                    <svg width="12" height="12" viewBox="0 0 12 12">
                      <path
                        d="M2 6L5 9L10 3"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </SelectIndicator>
              </ProjectCard>
            ))}
        </ProjectList>

        {/* 푸터 */}
        <ModalFooter>
          <CancelButton onClick={onClose}>Cancel</CancelButton>
          <ApplyButton
            onClick={onApply}
            disabled={!selectedProject}
          >
            <PluginIcon size={14} />
            Open {targetPlugin.name}
          </ApplyButton>
        </ModalFooter>
      </Modal>
    </Overlay>
  );
};

export default TravelProjectSelectModal;

/* ──── Animations ──── */
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const cardIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(-8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: 200px 0; }
`;

/* ──── Styled Components ──── */
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: ${fadeIn} 0.2s ease;
`;

const Modal = styled.div`
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 480px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.18);
  animation: ${slideUp} 0.3s cubic-bezier(0.22, 1, 0.36, 1);
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 22px 16px;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const PluginIconWrap = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalTitle = styled.h3`
  font-family: "Playfair Display", serif;
  font-size: 17px;
  font-weight: 700;
  color: #1e1b4b;
  margin: 0;
`;

const ModalSubtitle = styled.p`
  font-size: 12.5px;
  color: #8888a0;
  margin: 1px 0 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #8888a0;
  padding: 6px;
  border-radius: 8px;
  transition: background 0.15s;

  &:hover {
    background: #f5f5fa;
  }
`;

const SearchWrap = styled.div`
  position: relative;
  padding: 0 22px;
  margin-bottom: 4px;

  .search-icon {
    position: absolute;
    left: 34px;
    top: 50%;
    transform: translateY(-50%);
    color: #b0b0c0;
    pointer-events: none;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 12px 10px 36px;
  border: 1px solid #e8e8f0;
  border-radius: 10px;
  font-size: 13.5px;
  color: #1a1a2e;
  outline: none;
  background: #fafaff;
  transition: all 0.15s;

  &:focus {
    border-color: #a5b4fc;
    background: white;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08);
  }

  &::placeholder {
    color: #c0c0d0;
  }
`;

const ProjectList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px 22px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 180px;
  max-height: 380px;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(99, 102, 241, 0.2);
    border-radius: 2px;
  }
`;

const ProjectCard = styled.div<{ $selected: boolean; $index: number }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1.5px solid ${({ $selected }) => ($selected ? "#6366f1" : "transparent")};
  background: ${({ $selected }) => ($selected ? "#f5f3ff" : "rgba(250, 250, 255, 0.5)")};
  cursor: pointer;
  transition: all 0.2s ease;
  animation: ${cardIn} 0.3s ease both;
  animation-delay: ${({ $index }) => 0.05 * $index}s;

  &:hover {
    background: ${({ $selected }) => ($selected ? "#f5f3ff" : "#f8f8ff")};
    border-color: ${({ $selected }) => ($selected ? "#6366f1" : "#e0e0f0")};
  }
`;

const ProjectAvatar = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
`;

const ProjectInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ProjectName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #1e1b4b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ProjectMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 3px;
`;

const MetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11.5px;
  color: #8888a0;
`;

const SelectIndicator = styled.div<{ $selected: boolean }>`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid ${({ $selected }) => ($selected ? "#6366f1" : "#d0d0e0")};
  background: ${({ $selected }) => ($selected ? "#6366f1" : "transparent")};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 8px;
`;

const EmptyText = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #6b6b80;
`;

const EmptyDesc = styled.span`
  font-size: 12.5px;
  color: #a0a0b5;
  text-align: center;
`;

const SkeletonCard = styled.div`
  height: 68px;
  border-radius: 12px;
  background: linear-gradient(90deg, #f0f0f8 25%, #f8f8ff 50%, #f0f0f8 75%);
  background-size: 200px 100%;
  animation: ${shimmer} 1.5s infinite;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 22px;
  border-top: 1px solid #f0f0f5;
`;

const CancelButton = styled.button`
  padding: 9px 18px;
  background: none;
  border: 1px solid #e0e0e8;
  border-radius: 9px;
  font-size: 13px;
  color: #6b6b80;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: #f8f8fc;
  }
`;

const ApplyButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 20px;
  background: #4f46e5;
  border: none;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 500;
  color: white;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: #4338ca;
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;
