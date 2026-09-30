import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import styled, {keyframes} from "styled-components";
import {Plus} from "lucide-react";
import {useGetMyTravels} from "../../../../../hooks/useTravelQueries";
import {TravelResponse} from "../../../../../types/travel/travelTypes";
import TravelProjectThumb from "../../common/TravelProjectThumb";

export interface TravelRecentProjectsProps {}

function TravelRecentProjects(_props: TravelRecentProjectsProps) {
  const navigate = useNavigate();
  const {data, isLoading} = useGetMyTravels(0, 10);
  const [loaded, setLoaded] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    setLoaded(true);
  }, []);

  const travels: TravelResponse[] = data?.travels ?? [];

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  return (
    <StyledTravelRecentProjects>
      <div className="recent-row">
        {isLoading &&
          [1, 2, 3].map((i) => (
            <div key={i} className="project-circle-wrap loaded">
              <div className="project-circle skeleton" />
              <span className="project-circle-title skeleton-text" />
            </div>
          ))}

        {!isLoading &&
          travels.map((project, i) => (
            <div
              key={project.id}
              className={`project-circle-wrap ${loaded ? "loaded" : ""}`}
              style={{animationDelay: `${0.3 + i * 0.1}s`}}
              onMouseEnter={() => setHoveredId(project.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => navigate(`/travel/dashboard/${project.id}`)}
            >
              <div
                className={`project-circle ${hoveredId === project.id ? "hovered" : ""}`}
              >
                <TravelProjectThumb
                  seed={project.id}
                  src={project.coverImageUrl}
                  alt={project.title}
                />
              </div>
              <span className="project-circle-title">
                {project.destination || project.title}
              </span>
              <span className="project-circle-date">
                {formatDate(project.startDate || project.created)}
              </span>
            </div>
          ))}

        <div
          className={`project-circle-wrap ${loaded ? "loaded" : ""}`}
          style={{animationDelay: `${0.3 + travels.length * 0.1}s`}}
          onClick={() => navigate("/travel/create")}
        >
          <div className="add-circle">
            <Plus size={26} strokeWidth={1.4} className="add-circle-icon" />
          </div>
          <span className="project-circle-title">New Trip</span>
        </div>
      </div>
    </StyledTravelRecentProjects>
  );
}

export default TravelRecentProjects;

const scaleIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.92);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: 200px 0; }
`;

const StyledTravelRecentProjects = styled.div`
  margin-top: 2rem;

  .recent-row {
    display: flex;
    gap: 28px;
    padding: 8px 0;
    align-items: flex-start;
    overflow-x: auto;

    &::-webkit-scrollbar {
      height: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.15);
      border-radius: 2px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
  }

  .project-circle-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    flex-shrink: 0;
    opacity: 0;

    &.loaded {
      animation: ${scaleIn} 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
    }
  }

  .project-circle {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.04);
    transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);

    &.hovered {
      transform: scale(1.06);
      border-color: rgba(255, 255, 255, 0.25);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
    }

    &.skeleton {
      background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.04) 25%,
        rgba(255, 255, 255, 0.08) 50%,
        rgba(255, 255, 255, 0.04) 75%
      );
      background-size: 200px 100%;
      animation: ${shimmer} 1.5s infinite;
      border-color: transparent;
    }
  }

  .project-circle-title {
    font-size: 13px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.92);

    &.skeleton-text {
      width: 48px;
      height: 13px;
      border-radius: 4px;
      background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.04) 25%,
        rgba(255, 255, 255, 0.08) 50%,
        rgba(255, 255, 255, 0.04) 75%
      );
      background-size: 200px 100%;
      animation: ${shimmer} 1.5s infinite;
    }
  }

  .project-circle-date {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.45);
    font-weight: 300;
  }

  .add-circle {
    width: 104px;
    height: 104px;
    border-radius: 50%;
    border: 1.5px dashed rgba(255, 255, 255, 0.18);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.25s ease;
    background: transparent;
    color: rgba(255, 255, 255, 0.55);
  }

  .project-circle-wrap:hover .add-circle {
    border-color: rgba(125, 151, 134, 0.85);
    background: rgba(80, 107, 92, 0.12);
    color: #a9c19f;
  }

  .add-circle-icon {
    color: currentColor;
  }

  @media screen and (max-width: 600px) {
    .recent-row {
      gap: 20px;
    }

    .project-circle {
      width: 64px;
      height: 64px;
    }

    .add-circle {
      width: 84px;
      height: 84px;
    }
  }
`;
