import React from "react";
import styled from "styled-components";
import {Box, Stack, Text} from "@chakra-ui/react";
import {ArrowRight, Bookmark} from "lucide-react";
import {useNavigate} from "react-router-dom";
import {useFeaturedDocuments} from "../../../../../hooks/useFeaturedQueries";
import {useBlogLocale} from "../../../../../hooks/useBlogLocale";
import moment from "moment";
import MountainBackdrop from "./MountainBackdrop";

type HeroMode = "EDITORS_PICK" | "LATEST_STORY" | "ANNOUNCEMENT";

interface BlogHeroProps {
  /**
   * 폴백용 최신 글 (Featured 가 없을 때 LATEST_STORY 모드로 표시).
   * BlogPage 가 이미 받아오는 데이터를 재사용해서 추가 fetch 방지.
   */
  latestFallback?: DocumentDTO | null;
}

function BlogHero({latestFallback}: BlogHeroProps) {
  const navigate = useNavigate();
  const {blogViewUrl} = useBlogLocale();
  const {data: featured, isLoading: featuredLoading} = useFeaturedDocuments(1);

  const featuredDoc = featured?.[0];
  const mode: HeroMode = featuredDoc ? "EDITORS_PICK" : "LATEST_STORY";
  const card = featuredDoc ?? latestFallback;

  const handleRead = () => {
    if (!card?.id) return;
    navigate(blogViewUrl(card.id));
  };

  const heroTitle = featuredDoc?.featuredInfo?.featuredTitle || card?.title || "Quiet trails and hidden temples";
  const heroSubtitle = mode === "EDITORS_PICK" ? "EDITOR'S PICK" : "LATEST STORY";
  const ctaText = featuredDoc?.featuredInfo?.ctaButtonText || "Read story";

  // 읽기 시간 추정: 본문 길이가 들어오면 200 wpm 기준 분 단위. 없으면 표시 안 함.
  const readMinutes = (() => {
    const raw = (card as any)?.content || (card as any)?.body || "";
    if (typeof raw !== "string" || raw.length < 50) return null;
    const words = raw.trim().split(/\s+/).length;
    return Math.max(1, Math.round(words / 200));
  })();

  return (
    <StyledHero>
      <MountainBackdrop />

      {/* 페이지 시그니처 라벨 (좌상단) */}
      <Box position="relative" zIndex={1} p={{base: 5, md: 7}}>
        <Text color="rgba(255,255,255,0.92)" fontSize={{base: "lg", md: "xl"}} fontWeight="600">
          Nadeliv Journal
        </Text>
        <Text color="rgba(255,255,255,0.55)" fontSize="sm" mt={1}>
          Travel stories from wherever the road leads
        </Text>
      </Box>

      {/* 큐레이션 카드 */}
      {(featuredLoading || card) && (
        <StyledHeroCard
          onClick={handleRead}
          role="link"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleRead();
          }}
        >
          <Stack direction={{base: "column", md: "row"}} gap={{base: 4, md: 6}} align={{base: "flex-start", md: "center"}} justify="space-between">
            <Box flex={1} minW={0}>
              <Stack direction="row" gap={2} align="center" mb={2}>
                <BadgePill>
                  <Bookmark size={12} />
                  <span>{heroSubtitle}</span>
                </BadgePill>
                {featuredDoc?.tags?.[0] && (
                  <BadgePill variant="outline">{featuredDoc.tags[0]}</BadgePill>
                )}
              </Stack>
              <Text
                color="white"
                fontFamily={`Georgia, "Times New Roman", serif`}
                fontSize={{base: "2xl", md: "3xl"}}
                fontWeight="700"
                lineHeight={1.2}
                lineClamp={2}
                letterSpacing="-0.01em"
              >
                {heroTitle}
              </Text>
              <Stack direction="row" gap={2} mt={3} color="rgba(255,255,255,0.6)" fontSize="xs">
                {card?.createdUser && <span>By {card.createdUser}</span>}
                {card?.updated && <span>· {moment(card.updated).format("MMM D, YYYY")}</span>}
                {readMinutes && <span>· {readMinutes} min read</span>}
              </Stack>
            </Box>
            <ReadButton type="button" onClick={(e) => {e.stopPropagation(); handleRead();}}>
              <span>{ctaText}</span>
              <ArrowRight size={14} />
            </ReadButton>
          </Stack>
        </StyledHeroCard>
      )}
    </StyledHero>
  );
}

export default BlogHero;

const StyledHero = styled.div`
  position: relative;
  width: 100%;
  height: 420px;
  border-radius: 1rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin-bottom: 1.5rem;

  @media (max-width: 720px) {
    height: 360px;
  }
`;

const StyledHeroCard = styled.div`
  position: relative;
  z-index: 1;
  margin: 0 1.5rem 1.25rem;
  padding: 1.25rem 1.5rem;
  background: rgba(15, 22, 22, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.75rem;
  backdrop-filter: blur(6px);
  cursor: pointer;
  transition: transform 0.18s ease, background 0.18s ease;

  &:hover {
    background: rgba(15, 22, 22, 0.85);
    transform: translateY(-1px);
  }
  &:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.6);
    outline-offset: 2px;
  }

  @media (max-width: 720px) {
    margin: 0 0.75rem 0.75rem;
    padding: 1rem;
  }
`;

const BadgePill = styled.span<{ variant?: "outline" }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${(p) => (p.variant === "outline" ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.92)")};
  background: ${(p) => (p.variant === "outline" ? "transparent" : "rgba(255,255,255,0.08)")};
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
`;

const ReadButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  color: white;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
  &:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.6);
    outline-offset: 2px;
  }
`;
