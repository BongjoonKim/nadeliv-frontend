import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { Box, Container } from "@chakra-ui/react";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Clock,
  Eye,
  EyeOff,
  Settings,
  Plus,
  ChevronRight,
  Plane,
  CheckCircle2,
  CircleDot,
  Circle,
  XCircle,
  Tag,
  Puzzle,
  LayoutGrid,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { TRAVEL_PLUGINS } from "../../../../constants/travelPlugins";
import {
  PLUGIN_KEY_PREFIX,
  resolveDashboardItems,
} from "../../../../constants/travelDashboardItems";
import {
  useGetTravel,
  useGetTravelMedia,
} from "../../../../hooks/useTravelQueries";
import {
  TravelDashboardItem,
  TravelStatus,
} from "../../../../types/travel/travelTypes";
import { useCurrentUser } from "../../../../hooks/useCurrentUser";
import TravelAlbum from "./TravelAlbum";
import TravelMembers from "./TravelMembers";
import TravelSettings from "./TravelSettings";
import DashboardCustomize from "./DashboardCustomize";
import { getTravelProjectColor } from "../common/TravelProjectThumb";

export interface TravelDashboardProps {}

const STATUS_CONFIG: Record<
  TravelStatus,
  { label: string; icon: any; color: string; bg: string }
> = {
  PLANNING: {
    label: "Planning",
    icon: Circle,
    color: "#7fb89a",
    bg: "rgba(127,184,154,0.12)",
  },
  IN_PROGRESS: {
    label: "In Progress",
    icon: CircleDot,
    color: "#d8b46a",
    bg: "rgba(216,180,106,0.12)",
  },
  COMPLETED: {
    label: "Completed",
    icon: CheckCircle2,
    color: "#86c9a4",
    bg: "rgba(134,201,164,0.12)",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: XCircle,
    color: "#94a3a0",
    bg: "rgba(148,163,160,0.12)",
  },
};

function TravelDashboard(props: TravelDashboardProps) {
  const { travelId } = useParams<{ travelId: string }>();
  const navigate = useNavigate();
  const { data: travel, isLoading, error } = useGetTravel(travelId);
  const { data: currentUser } = useCurrentUser();
  // Album 을 박스로 표시할 때 사진 개수용 (TravelAlbum 과 동일 쿼리키 → 캐시 공유)
  const { data: travelMedia } = useGetTravelMedia(travelId);
  const [loaded, setLoaded] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  const currentUserId = currentUser?.id;
  const isAdmin = travel?.members?.some(
    (m) => m.userId === currentUserId && m.role === "ADMIN"
  ) ?? false;
  const isViewer = travel?.members?.some(
    (m) => m.userId === currentUserId && m.role === "VIEWER"
  ) ?? false;
  // ADMIN 또는 USER만 편집 가능
  const canEdit = !isViewer && (travel?.members?.some(
    (m) => m.userId === currentUserId
  ) ?? false)

  useEffect(() => {
    if (travel) setLoaded(true);
  }, [travel]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // 박스(stat) 표시용 축약 날짜 (예: 8.26)
  const formatShortDate = (dateStr?: string) => {
    if (!dateStr) return "?";
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}.${d.getDate()}`;
  };

  const getDaysCount = () => {
    if (!travel?.startDate || !travel?.endDate) return null;
    const start = new Date(travel.startDate);
    const end = new Date(travel.endDate);
    const diff = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diff + 1;
  };

  const getDDay = () => {
    if (!travel?.startDate) return null;
    const start = new Date(travel.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    const diff = Math.ceil(
      (start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff > 0) return `D-${diff}`;
    if (diff === 0) return "D-Day";
    return `D+${Math.abs(diff)}`;
  };

  const containerProps = {
    maxW: "7xl" as const,
    px: { base: 0, sm: 0, lg: 0 },
    h: "100%",
    flex: "1",
    flexDirection: "column" as const,
    display: "flex",
  };

  if (isLoading) {
    return (
      <StyledShell>
        <Container {...containerProps}>
          <StyledTravelDashboard>
            <div className="loading-state">
              <div className="loading-spinner" />
              <span>Loading project...</span>
            </div>
          </StyledTravelDashboard>
        </Container>
      </StyledShell>
    );
  }

  if (error || !travel) {
    return (
      <StyledShell>
        <Container {...containerProps}>
          <StyledTravelDashboard>
            <div className="error-state">
              <p>Travel project not found</p>
              <button
                className="back-btn"
                onClick={() => navigate("/travel/home")}
              >
                <ArrowLeft size={16} />
                Back to Home
              </button>
            </div>
          </StyledTravelDashboard>
        </Container>
      </StyledShell>
    );
  }

  const statusConfig = STATUS_CONFIG[travel.status];
  const StatusIcon = statusConfig.icon;
  const daysCount = getDaysCount();
  const dDay = getDDay();

  // 대시보드 구성 — 프로젝트별 저장값 + 레지스트리 동기화 (없으면 기본 구성)
  const dashboardItems = resolveDashboardItems(travel.dashboardItems);
  const statItems = dashboardItems.filter(
    (item) => item.visible && item.display === "stat"
  );
  const rowItems = dashboardItems.filter(
    (item) => item.visible && item.display === "row"
  );

  const pluginStatValue = (pluginKey: string): number | null => {
    switch (pluginKey) {
      case "chat":
        return travel.channelIds?.length ?? 0;
      case "korea-map":
        return travel.visitedRegionCodes?.length ?? 0;
      case "course":
        return travel.visitedPlaces?.length ?? 0;
      default:
        return null;
    }
  };

  const renderStatCard = (item: TravelDashboardItem) => {
    switch (item.key) {
      case "dday":
        return dDay ? (
          <div key={item.key} className="stat-card accent">
            <span className="stat-value">{dDay}</span>
            <span className="stat-label">D-Day</span>
          </div>
        ) : null;
      case "duration":
        return daysCount ? (
          <div key={item.key} className="stat-card">
            <Calendar size={18} className="stat-icon" />
            <span className="stat-value">
              {daysCount}
              <small>days</small>
            </span>
            <span className="stat-label">Duration</span>
          </div>
        ) : null;
      case "members-count":
        return (
          <div key={item.key} className="stat-card">
            <Users size={18} className="stat-icon" />
            <span className="stat-value">
              {travel.memberCount ?? travel.members?.length ?? 0}
            </span>
            <span className="stat-label">Members</span>
          </div>
        );
      case "schedules-count":
      case "schedules":
        return (
          <div key={item.key} className="stat-card">
            <Clock size={18} className="stat-icon" />
            <span className="stat-value">{travel.schedules?.length ?? 0}</span>
            <span className="stat-label">Schedules</span>
          </div>
        );
      // 섹션을 박스로 표시할 때의 축약형
      case "album":
        return (
          <div key={item.key} className="stat-card">
            <ImageIcon size={18} className="stat-icon" />
            <span className="stat-value">{travelMedia?.length ?? 0}</span>
            <span className="stat-label">Album</span>
          </div>
        );
      case "dates":
        return (
          <div key={item.key} className="stat-card">
            <Calendar size={18} className="stat-icon" />
            <span className="stat-value stat-value--text">
              {travel.startDate || travel.endDate
                ? `${formatShortDate(travel.startDate)} ~ ${formatShortDate(travel.endDate)}`
                : "—"}
            </span>
            <span className="stat-label">Dates</span>
          </div>
        );
      case "about":
        return (
          <div key={item.key} className="stat-card">
            <FileText size={18} className="stat-icon" />
            <span className="stat-value stat-value--text stat-value--clamp">
              {travel.description ? travel.description : "—"}
            </span>
            <span className="stat-label">About</span>
          </div>
        );
      case "tags":
        return (
          <div key={item.key} className="stat-card">
            <Tag size={18} className="stat-icon" />
            <span className="stat-value">{travel.tags?.length ?? 0}</span>
            <span className="stat-label">Tags</span>
          </div>
        );
      case "members":
        return (
          <div key={item.key} className="stat-card">
            <Users size={18} className="stat-icon" />
            <span className="stat-value">
              {travel.memberCount ?? travel.members?.length ?? 0}
            </span>
            <span className="stat-label">Members</span>
          </div>
        );
      default: {
        // 플러그인 스탯 박스 — 클릭 시 플러그인으로 이동
        if (!item.key.startsWith(PLUGIN_KEY_PREFIX)) return null;
        const pluginKey = item.key.slice(PLUGIN_KEY_PREFIX.length);
        const plugin = TRAVEL_PLUGINS.find((p) => p.key === pluginKey);
        if (!plugin) return null;
        const PluginIcon = plugin.icon;
        const value = pluginStatValue(pluginKey);
        return (
          <div
            key={item.key}
            className="stat-card clickable"
            onClick={() => navigate(plugin.path(travel.id))}
          >
            <PluginIcon size={18} className="stat-icon" />
            <span className="stat-value">{value ?? "Open"}</span>
            <span className="stat-label">{plugin.name}</span>
          </div>
        );
      }
    }
  };

  // 플러그인 row 카드 (chat-entry 스타일)
  const renderPluginCard = (item: TravelDashboardItem) => {
    const pluginKey = item.key.slice(PLUGIN_KEY_PREFIX.length);
    const plugin = TRAVEL_PLUGINS.find((p) => p.key === pluginKey);
    if (!plugin) return null;
    const PluginIcon = plugin.icon;
    const desc =
      plugin.key === "chat" && travel.channelIds && travel.channelIds.length > 0
        ? `${travel.channelIds.length} channel${travel.channelIds.length > 1 ? "s" : ""} active`
        : plugin.key === "korea-map" &&
            travel.visitedRegionCodes &&
            travel.visitedRegionCodes.length > 0
          ? `${travel.visitedRegionCodes.length} region${travel.visitedRegionCodes.length > 1 ? "s" : ""} visited`
          : plugin.key === "course" &&
              travel.visitedPlaces &&
              travel.visitedPlaces.length > 0
            ? `${travel.visitedPlaces.length} place${travel.visitedPlaces.length > 1 ? "s" : ""} on the course`
            : plugin.description;
    return (
      <div
        key={item.key}
        className="chat-entry"
        onClick={() => navigate(plugin.path(travel.id))}
      >
        <div className="chat-entry-icon">
          <PluginIcon size={24} />
        </div>
        <div className="chat-entry-content">
          <span className="chat-entry-title">{plugin.name}</span>
          <span className="chat-entry-desc">{desc}</span>
        </div>
        <ChevronRight size={18} className="chat-entry-arrow" />
      </div>
    );
  };

  // row 섹션 렌더러 — 구성 배열 순서대로 호출됨
  const renderRowSection = (item: TravelDashboardItem) => {
    switch (item.key) {
      case "album":
        return <TravelAlbum key={item.key} travelId={travel.id} />;
      case "dates":
        return travel.startDate || travel.endDate ? (
          <div key={item.key} className="dash-section date-section">
            <Calendar size={16} className="section-icon" />
            <span className="date-range">
              {formatDate(travel.startDate)} ~ {formatDate(travel.endDate)}
            </span>
          </div>
        ) : null;
      case "about":
        return travel.description ? (
          <div key={item.key} className="dash-section">
            <h3 className="section-title">About</h3>
            <p className="section-text">{travel.description}</p>
          </div>
        ) : null;
      case "tags":
        return (
          <div key={item.key} className="dash-section">
            <h3 className="section-title">
              <Tag size={16} />
              Tags
            </h3>
            {travel.tags && travel.tags.length > 0 ? (
              <div className="tags-wrap">
                {travel.tags.map((tag) => (
                  <span key={tag} className="tag-chip">
                    #{tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="empty-text">No tags yet</p>
            )}
          </div>
        );
      case "members":
        return (
          <div key={item.key} className="dash-section">
            <TravelMembers
              travelId={travel.id}
              members={travel.members}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
            />
          </div>
        );
      case "schedules":
        return (
          <div key={item.key} className="dash-section">
            <div className="section-header">
              <h3 className="section-title">
                <Clock size={16} />
                Schedules
              </h3>
              {canEdit && (
                <button className="section-action">
                  <Plus size={16} />
                </button>
              )}
            </div>
            <div className="schedules-list">
              {travel.schedules
                ?.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                .map((schedule) => (
                  <div key={schedule.id} className="schedule-item">
                    <div className="schedule-day">
                      {schedule.dayNumber ? `Day ${schedule.dayNumber}` : ""}
                    </div>
                    <div className="schedule-content">
                      <span className="schedule-title">{schedule.title}</span>
                      {schedule.date && (
                        <span className="schedule-date">
                          {formatDate(schedule.date)}
                        </span>
                      )}
                      {schedule.description && (
                        <p className="schedule-desc">{schedule.description}</p>
                      )}
                      {schedule.places && schedule.places.length > 0 && (
                        <div className="schedule-places">
                          {schedule.places.map((place, i) => (
                            <span key={i} className="place-chip">
                              <MapPin size={11} />
                              {place.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <ChevronRight size={16} className="schedule-arrow" />
                  </div>
                ))}
              {(!travel.schedules || travel.schedules.length === 0) && (
                <div className="empty-schedules">
                  <Clock size={32} />
                  <p>No schedules yet</p>
                  <span>Add your first schedule to start planning</span>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // row 항목을 구성 순서대로 블록화 — 연속된 플러그인은 하나의 Plugins 섹션으로 묶음
  const rowBlocks: JSX.Element[] = [];
  {
    let pluginBuffer: TravelDashboardItem[] = [];
    const flushPlugins = () => {
      if (pluginBuffer.length === 0) return;
      rowBlocks.push(
        <div
          key={`plugins-${pluginBuffer[0].key}`}
          className="dash-section"
        >
          <div className="section-header">
            <h3 className="section-title">
              <Puzzle size={16} />
              Plugins
            </h3>
          </div>
          <div className="plugins-grid">
            {pluginBuffer.map(renderPluginCard)}
          </div>
        </div>
      );
      pluginBuffer = [];
    };
    rowItems.forEach((item) => {
      if (item.key.startsWith(PLUGIN_KEY_PREFIX)) {
        pluginBuffer.push(item);
      } else {
        flushPlugins();
        const section = renderRowSection(item);
        if (section) rowBlocks.push(section);
      }
    });
    flushPlugins();
  }

  return (
    <StyledShell>
    <Container {...containerProps}>
    <StyledTravelDashboard className={loaded ? "loaded" : ""}>
      {/* Header */}
      <div className="dash-header">
        <button className="back-btn" onClick={() => navigate("/travel/home")}>
          <ArrowLeft size={20} />
        </button>
        <div className="dash-header-right">
          {canEdit && (
            <button
              className="settings-btn"
              onClick={() => setCustomizeOpen(true)}
              title="Customize dashboard"
            >
              <LayoutGrid size={18} />
            </button>
          )}
          {isAdmin && (
            <button className="settings-btn" onClick={() => setSettingsOpen(true)}>
              <Settings size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Hero Banner */}
      <div className="dash-hero">
        {travel.coverImageUrl ? (
          <img
            src={travel.coverImageUrl}
            alt={travel.title}
            className="dash-hero-img"
          />
        ) : (
          <div
            className="dash-hero-placeholder"
            style={{ background: getTravelProjectColor(travel.id) }}
          >
            <Plane size={48} />
          </div>
        )}
        <div className="dash-hero-overlay" />
        <div className="dash-hero-content">
          <div className="dash-hero-status">
            <span
              className="status-badge"
              style={{
                color: statusConfig.color,
                background: statusConfig.bg,
              }}
            >
              <StatusIcon size={14} />
              {statusConfig.label}
            </span>
            {travel.visibility === "PRIVATE" ? (
              <span className="visibility-badge private">
                <EyeOff size={12} />
                Private
              </span>
            ) : (
              <span className="visibility-badge public">
                <Eye size={12} />
                Public
              </span>
            )}
          </div>
          <h1 className="dash-hero-title">{travel.title}</h1>
          {travel.destination && (
            <p className="dash-hero-destination">
              <MapPin size={14} />
              {travel.destination}
            </p>
          )}
        </div>
      </div>

      {/* Stats Cards — 대시보드 구성(stat 표시 항목) 기반 */}
      {statItems.length > 0 && (
        <div className="dash-stats">{statItems.map(renderStatCard)}</div>
      )}

      {/* Row 섹션 — 구성 순서대로 (연속 플러그인은 Plugins 섹션으로 묶임) */}
      {rowBlocks}

      {/* Dashboard Customize Modal */}
      <DashboardCustomize
        travelId={travel.id}
        currentItems={dashboardItems}
        isOpen={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
      />

      {/* Settings Modal */}
      <TravelSettings
        travelId={travel.id}
        currentTitle={travel.title}
        currentDescription={travel.description}
        currentTags={travel.tags}
        currentVisibility={travel.visibility}
        currentCoverImageUrl={travel.coverImageUrl}
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onDeleted={() => navigate("/travel/home")}
      />
    </StyledTravelDashboard>
    </Container>
    </StyledShell>
  );
}

export default TravelDashboard;

const fadeUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

// TravelHome 과 동일한 다크 셸 — /travel/home 과 시각 통일.
const StyledShell = styled(Box)`
  width: 100%;
  min-height: calc(100vh - 3rem);
  padding: 1.5rem 0 3rem;
  background: #0a0c0c;
  color: white;
`;

const StyledTravelDashboard = styled.div`
  width: 100%;
  min-height: 100%;
  padding: 1rem 2rem 3rem;
  font-family: "Noto Sans KR", sans-serif;
  color: #e8eaeb;
  opacity: 0;

  &.loaded {
    animation: ${fadeUp} 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  /* Loading & Error */
  .loading-state,
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    min-height: 300px;
    color: #b6d4c1;
    font-size: 15px;
  }

  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(80, 107, 92, 0.2);
    border-top-color: #7fb89a;
    border-radius: 50%;
    animation: ${spin} 0.7s linear infinite;
  }

  /* Header */
  .dash-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .back-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
    border-radius: 12px;
    color: #c7d2cc;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.25s ease;

    &:hover {
      background: rgba(46, 87, 62, 0.22);
      border-color: rgba(80, 107, 92, 0.45);
      color: #ffffff;
    }
  }

  .settings-btn {
    padding: 8px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
    border-radius: 10px;
    color: #c7d2cc;
    cursor: pointer;
    transition: all 0.25s ease;

    &:hover {
      background: rgba(46, 87, 62, 0.22);
      border-color: rgba(80, 107, 92, 0.45);
      color: #ffffff;
    }
  }

  /* Hero */
  .dash-hero {
    position: relative;
    border-radius: 20px;
    overflow: hidden;
    height: 220px;
    margin-bottom: 1.5rem;
  }

  .dash-hero-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .dash-hero-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.55);
  }

  .dash-hero-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to top,
      rgba(15, 10, 30, 0.75) 0%,
      rgba(15, 10, 30, 0.1) 50%,
      transparent 100%
    );
  }

  .dash-hero-content {
    position: absolute;
    bottom: 0;
    left: 0;
    padding: 24px 28px;
    z-index: 1;
  }

  .dash-hero-status {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.03em;
  }

  .visibility-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 500;

    &.private {
      background: rgba(255, 255, 255, 0.15);
      color: rgba(255, 255, 255, 0.8);
    }
    &.public {
      background: rgba(127, 184, 154, 0.18);
      color: rgba(127, 184, 154, 0.95);
    }
  }

  .dash-hero-title {
    font-family: "Playfair Display", serif;
    font-size: 28px;
    font-weight: 700;
    color: #fff;
    margin-bottom: 4px;
  }

  .dash-hero-destination {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
  }

  /* Stats — 한 줄 최대 4개, 넘치면 다음 줄로 */
  .dash-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 1.5rem;
  }

  .stat-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 16px 12px;
    border-radius: 16px;
    background: #14191a;
    border: 1px solid rgba(255, 255, 255, 0.08);

    &.accent {
      background: linear-gradient(135deg, rgba(46, 87, 62, 0.25), rgba(46, 87, 62, 0.08));
      border-color: rgba(80, 107, 92, 0.45);
    }

    /* 플러그인 스탯 박스 — 클릭 시 해당 플러그인으로 이동 */
    &.clickable {
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: #1a2021;
        border-color: rgba(80, 107, 92, 0.45);
      }
    }
  }

  .stat-icon {
    color: #7fb89a;
  }

  .stat-value {
    font-size: 22px;
    font-weight: 700;
    color: #ffffff;

    small {
      font-size: 12px;
      font-weight: 400;
      color: #94a3a0;
      margin-left: 3px;
    }

    /* 텍스트형 값 (Dates 범위, About 스니펫 등) */
    &.stat-value--text {
      font-size: 14px;
      font-weight: 600;
      text-align: center;
      line-height: 1.4;
    }

    &.stat-value--clamp {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      max-width: 100%;
      padding: 0 4px;
      font-weight: 400;
      color: #d6dad8;
    }
  }

  .stat-label {
    font-size: 12px;
    color: #94a3a0;
    font-weight: 400;
  }

  /* Date Section */
  .date-section {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .section-icon {
    color: #7fb89a;
  }

  .date-range {
    font-size: 14px;
    color: #d6dad8;
    font-weight: 500;
  }

  /* Sections */
  .dash-section {
    padding: 1.25rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);

    &:last-child {
      border-bottom: none;
    }
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: #ffffff;
  }

  .section-action {
    padding: 6px;
    border: 1.5px dashed rgba(80, 107, 92, 0.45);
    border-radius: 10px;
    background: transparent;
    color: #b6d4c1;
    cursor: pointer;
    transition: all 0.25s ease;

    &:hover {
      border-color: rgba(80, 107, 92, 0.7);
      color: #7fb89a;
      background: rgba(46, 87, 62, 0.18);
    }
  }

  .section-text {
    font-size: 14px;
    color: #d6dad8;
    line-height: 1.7;
    white-space: pre-wrap;
  }

  .empty-text {
    font-size: 13px;
    color: #94a3a0;
  }

  /* Tags */
  .tags-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .tag-chip {
    padding: 4px 12px;
    border-radius: 20px;
    background: rgba(46, 87, 62, 0.22);
    color: #b6d4c1;
    border: 1px solid rgba(80, 107, 92, 0.35);
    font-size: 13px;
    font-weight: 500;
  }

  /* Members */
  .members-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .member-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    border-radius: 14px;
    background: #14191a;
    border: 1px solid rgba(255, 255, 255, 0.06);
    transition: background 0.2s, border-color 0.2s;

    &:hover {
      background: #1a2021;
      border-color: rgba(80, 107, 92, 0.35);
    }
  }

  .member-avatar {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    background: linear-gradient(135deg, #2f5743, #386851);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    font-weight: 600;
    flex-shrink: 0;
  }

  .member-info {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .member-name {
    font-size: 14px;
    font-weight: 500;
    color: #f1f3f2;
  }

  .member-role {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 6px;
    letter-spacing: 0.04em;

    &.admin {
      background: rgba(46, 87, 62, 0.32);
      color: #7fb89a;
    }
    &.user {
      background: rgba(255, 255, 255, 0.08);
      color: #c7d2cc;
    }
    &.viewer {
      background: rgba(148, 163, 160, 0.16);
      color: #94a3a0;
    }
  }

  /* Schedules */
  .schedules-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .schedule-item {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 14px 16px;
    border-radius: 14px;
    background: #14191a;
    border: 1px solid rgba(255, 255, 255, 0.06);
    cursor: pointer;
    transition: all 0.25s ease;

    &:hover {
      background: #1a2021;
      border-color: rgba(80, 107, 92, 0.45);
    }
  }

  .schedule-day {
    min-width: 56px;
    font-size: 12px;
    font-weight: 700;
    color: #7fb89a;
    padding-top: 2px;
  }

  .schedule-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .schedule-title {
    font-size: 14px;
    font-weight: 600;
    color: #ffffff;
  }

  .schedule-date {
    font-size: 12px;
    color: #94a3a0;
  }

  .schedule-desc {
    font-size: 13px;
    color: #d6dad8;
    line-height: 1.5;
  }

  .schedule-places {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 6px;
  }

  .place-chip {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 3px 8px;
    background: rgba(127, 184, 154, 0.14);
    color: #7fb89a;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 500;
  }

  .schedule-arrow {
    color: #7fb89a;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .empty-schedules {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 2.5rem 1rem;
    color: #94a3a0;
    text-align: center;

    p {
      font-size: 15px;
      font-weight: 500;
      color: #c7d2cc;
    }

    span {
      font-size: 13px;
      color: #94a3a0;
    }
  }

  /* Plugins */
  .plugins-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 10px;
  }

  /* Chat Entry (플러그인 카드 공용) */
  .chat-entry {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.15s ease;
    background: #14191a;
    border: 1px solid rgba(255, 255, 255, 0.06);

    &:hover {
      background: #1a2021;
      border-color: rgba(80, 107, 92, 0.45);
    }
  }

  .chat-entry-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: linear-gradient(135deg, #2f5743, #386851);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .chat-entry-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .chat-entry-title {
    font-size: 14px;
    font-weight: 600;
    color: #ffffff;
  }

  .chat-entry-desc {
    font-size: 12.5px;
    color: #94a3a0;
  }

  .chat-entry-arrow {
    color: #7fb89a;
    flex-shrink: 0;
  }

  @media screen and (max-width: 600px) {
    padding: 1rem;

    .dash-hero {
      height: 180px;
    }

    .dash-hero-title {
      font-size: 22px;
    }

    .dash-stats {
      grid-template-columns: repeat(2, 1fr);
    }

    .schedule-item {
      flex-direction: column;
      gap: 8px;
    }

    .schedule-day {
      min-width: auto;
    }
  }
`;
