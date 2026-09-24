import React, { useMemo } from "react";
import styled, { css, keyframes } from "styled-components";
import { useNavigate } from "react-router-dom";
import { useAtomValue } from "jotai";
import {
  BookOpen,
  Map as MapIcon,
  Cloud,
  Languages,
  Route,
  Search,
  Plus,
  Image as ImageIcon,
} from "lucide-react";

import { homeTokens as t } from "./homeTokens";
import { useCurrentUser } from "../../../../hooks/useCurrentUser";
import { useGetMyTravels } from "../../../../hooks/useTravelQueries";
import { useFeaturedDocuments } from "../../../../hooks/useFeaturedQueries";
import { preferredLocaleAtom, resolveLocale } from "../../../../stores/jotai/localeAtom";
import useHeroSection from "../../../../common/layout/MainLayout/useHeroSection";
import SearchDropdown from "../../../../common/layout/MainLayout/HomeSearch/SearchDropdown";
import type { TravelResponse } from "../../../../types/travel/travelTypes";

const HERO_CHIPS = ["Jinju", "Gumi", "Hanok stay", "Temple food", "Coastal towns"];

function diffInDays(start?: string, end?: string): number | null {
  if (!start || !end) return null;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (Number.isNaN(s) || Number.isNaN(e)) return null;
  return Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1);
}

interface MainBodyProps {}

function MainBody(_props: MainBodyProps) {
  const navigate = useNavigate();
  const preferredLocale = useAtomValue(preferredLocaleAtom);

  const { data: me } = useCurrentUser();
  const isSignedIn = !!me;

  const { data: myTravels } = useGetMyTravels(0, 3);
  const trips = myTravels?.travels ?? [];

  const { data: featuredDocs } = useFeaturedDocuments(3);
  const activeLocale = resolveLocale(null, preferredLocale, isSignedIn);

  const visibleTrips = useMemo(() => trips.slice(0, 2), [trips]);

  // 검색은 기존 HeroSection 과 동일하게 useHeroSection + SearchDropdown 사용
  const {
    searchInfoQuery,
    handleSearchChange,
    isDropdownOpen,
    setIsDropdownOpen,
    documents,
    isLoading,
    dropdownRef,
    searchInputRef,
    handleKeyDown,
  } = useHeroSection();

  const handleChip = (chip: string) => {
    handleSearchChange(chip);
    searchInputRef.current?.focus();
  };

  const handleSearchSubmit = () => {
    const q = (searchInfoQuery ?? "").trim();
    if (!q) return;
    if (q.length >= 2) {
      setIsDropdownOpen(true);
    }
  };

  return (
    <StyledMainBody>
      <div className="wrap">
        {/* HERO */}
        <header className="hero reveal d1">
          <svg
            className="hero-mountains"
            viewBox="0 0 800 240"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <polygon
              points="0,240 0,150 160,80 320,140 480,70 640,130 800,90 800,240"
              fill="#1c2417"
            />
            <polygon
              points="0,240 0,180 200,120 380,175 560,110 740,165 800,150 800,240"
              fill="#141a10"
            />
          </svg>
          <div className="eyebrow">South Korea</div>
          <h1>Discover the Korea beyond Seoul</h1>
          <p className="hero-sub">
            Stories and trips from the quiet corners of the country
          </p>
          <div className="searchbar-wrap" ref={dropdownRef}>
            <div className="searchbar">
              <Search size={20} strokeWidth={1.5} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search a city, place, or experience…"
                aria-label="Search"
                value={searchInfoQuery ?? ""}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() =>
                  Number(searchInfoQuery?.length) >= 2 && setIsDropdownOpen(true)
                }
              />
              <button type="button" onClick={handleSearchSubmit}>
                Search
              </button>
            </div>
            <SearchDropdown
              documents={documents}
              isLoading={isLoading}
              isOpen={isDropdownOpen}
              onClose={() => setIsDropdownOpen(false)}
              searchInfoQuery={searchInfoQuery}
              anchorRef={dropdownRef}
            />
          </div>
          <div className="chips">
            {HERO_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                className="chip"
                onClick={() => handleChip(chip)}
              >
                {chip}
              </button>
            ))}
          </div>
        </header>

        {/* YOUR TRIPS — auth-gated */}
        {isSignedIn && (
          <section className="section reveal d2">
            <div className="section-head">
              <h2>Your trips</h2>
              <span className="note">Pick up where you left off</span>
            </div>
            <div className="trips">
              {visibleTrips.map((trip: TravelResponse) => {
                const days = diffInDays(trip.startDate, trip.endDate);
                const memberCount =
                  trip.memberCount ?? trip.members?.length ?? 1;
                return (
                  <a
                    key={trip.id}
                    className="card trip"
                    href={`/travel/dashboard/${trip.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/travel/dashboard/${trip.id}`);
                    }}
                  >
                    {trip.destination && (
                      <span className="badge">{trip.destination}</span>
                    )}
                    <h3>{trip.title}</h3>
                    <div className="tmeta">
                      <span>{days ? `${days} day${days > 1 ? "s" : ""}` : "—"}</span>
                      <span>
                        {memberCount} member{memberCount > 1 ? "s" : ""}
                      </span>
                    </div>
                    <span className="open">Open project →</span>
                  </a>
                );
              })}
              <a
                className="trip-new"
                href="/travel/create"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/travel/create");
                }}
              >
                <Plus size={26} strokeWidth={1.5} />
                <span>New trip</span>
              </a>
            </div>
          </section>
        )}

        {/* ENTRY CARDS */}
        <section className="section reveal d3">
          <div className="entries">
            <a
              className="card entry"
              href={`/blog/home/${activeLocale}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(`/blog/home/${activeLocale}`);
              }}
            >
              <BookOpen size={26} strokeWidth={1.5} />
              <h3>Read the journal</h3>
              <p>
                Travel stories from people who actually went — the quiet corners
                of Korea.
              </p>
              <span className="go">Browse stories →</span>
            </a>
            <a
              className="card entry"
              href="/travel/home"
              onClick={(e) => {
                e.preventDefault();
                navigate("/travel/home");
              }}
            >
              <MapIcon size={26} strokeWidth={1.5} />
              <h3>Plan a trip</h3>
              <p>
                Build an itinerary, save places, and plan together with your
                travel companions.
              </p>
              <span className="go">Start planning →</span>
            </a>
          </div>
        </section>

        {/* FEATURED STORIES */}
        {!!featuredDocs?.length && (
          <section className="section reveal d4">
            <div className="section-head">
              <h2>Featured stories</h2>
              <a
                className="more"
                href={`/blog/home/${activeLocale}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/blog/home/${activeLocale}`);
                }}
              >
                View all →
              </a>
            </div>
            <div className="featured">
              {featuredDocs.slice(0, 3).map((doc) => {
                const thumb =
                  doc.featuredInfo?.featuredImageUrl ||
                  doc.thumbnailImgUrl ||
                  "";
                const region = doc.featuredInfo?.location || "Korea";
                const title =
                  doc.featuredInfo?.featuredTitle || doc.title || "Untitled";
                return (
                  <a
                    key={doc.id}
                    className="card story"
                    href={`/blog/view/${activeLocale}/${doc.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      if (doc.id) navigate(`/blog/view/${activeLocale}/${doc.id}`);
                    }}
                  >
                    <div
                      className="thumb"
                      style={{
                        background: thumb
                          ? `#222 url(${thumb}) center/cover no-repeat`
                          : "#3a4a36",
                      }}
                    >
                      {!thumb && <ImageIcon size={28} strokeWidth={1.5} />}
                    </div>
                    <div className="body">
                      <h3>{title}</h3>
                      <div className="smeta">{region}</div>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* TRAVEL TOOLKIT — entries only, not live widgets */}
        <section className="section reveal d5">
          <div className="toolkit">
            <div className="kicker">Travel toolkit</div>
            <p className="lede">
              Handy tools — they open right where you need them, not here.
            </p>
            <div className="tiles">
              <div className="tile">
                <Cloud size={22} strokeWidth={1.5} />
                <h4>Weather</h4>
                <p>Conditions for each destination as you read.</p>
                <span className="where">In stories &amp; trips</span>
              </div>
              <div className="tile">
                <Languages size={22} strokeWidth={1.5} />
                <h4>Language helper</h4>
                <p>Translate signs, menus and phrases on the spot.</p>
                <span className="where">While reading</span>
              </div>
              <div className="tile">
                <Route size={22} strokeWidth={1.5} />
                <h4>Route finder</h4>
                <p>How to get there from where you are.</p>
                <span className="where">On place pages</span>
              </div>
            </div>
          </div>
        </section>

      </div>
    </StyledMainBody>
  );
}

export default MainBody;

/* ----------------------------- styled-components ---------------------------- */

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: none; }
`;

const cardSurface = css`
  background: ${t.color.surface};
  border: 0.5px solid ${t.color.border};
  border-radius: ${t.radius.lg};
  transition: border-color 0.2s, transform 0.2s;
  &:hover {
    border-color: ${t.color.border2};
    transform: translateY(-2px);
  }
`;

const StyledMainBody = styled.div`
  width: 100%;
  background: ${t.color.bg};
  color: ${t.color.text};
  font-family: ${t.font.sans};
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;

  .wrap {
    max-width: ${t.containerMaxW};
    margin: 0 auto;
    padding: 0 32px;
  }

  /* ---------- Hero ---------- */
  .hero {
    position: relative;
    overflow: hidden;
    border-radius: ${t.radius.lg};
    background: ${t.color.heroGradient};
    padding: 72px 32px 56px;
    text-align: center;
    margin-top: 24px;
  }
  .hero-mountains {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 62%;
    opacity: 0.22;
    pointer-events: none;
  }
  .hero > *:not(.hero-mountains) {
    position: relative;
    z-index: 1;
  }
  .eyebrow {
    font-size: 12px;
    letter-spacing: 0.26em;
    text-transform: uppercase;
    color: ${t.color.textSoft};
  }
  .hero h1 {
    font-family: ${t.font.serif};
    font-weight: 400;
    font-size: 52px;
    line-height: 1.15;
    color: #f8f9f4;
    margin: 16px 0 12px;
  }
  .hero-sub {
    font-size: 16px;
    color: ${t.color.textSoft};
    margin-bottom: 34px;
  }

  .hero .searchbar-wrap {
    position: relative;
    max-width: 560px;
    margin: 0 auto;
    text-align: left;
    z-index: 20;
  }
  .searchbar {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(12, 16, 11, 0.55);
    border: 0.5px solid ${t.color.border2};
    border-radius: ${t.radius.pill};
    padding: 6px 8px 6px 22px;
    transition: border-color 0.2s;
    color: #aebcab;
  }
  .searchbar:focus-within {
    border-color: rgba(255, 255, 255, 0.45);
  }
  .searchbar input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: ${t.color.text};
    font-family: ${t.font.sans};
    font-size: 15px;
    padding: 12px 0;
  }
  .searchbar input::placeholder {
    color: #8f9b8c;
  }
  .searchbar button {
    background: ${t.color.accentStrong};
    color: #eef7ef;
    border: none;
    cursor: pointer;
    border-radius: ${t.radius.pill};
    padding: 11px 22px;
    font-family: ${t.font.sans};
    font-size: 14px;
    transition: filter 0.2s;
  }
  .searchbar button:hover {
    filter: brightness(1.08);
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 9px;
    justify-content: center;
    margin-top: 22px;
  }
  .chip {
    font-size: 13px;
    color: ${t.color.textSoft};
    border: 0.5px solid ${t.color.border2};
    border-radius: ${t.radius.pill};
    padding: 6px 16px;
    cursor: pointer;
    transition: background 0.2s;
    background: transparent;
    font-family: ${t.font.sans};
  }
  .chip:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  /* ---------- Section header ---------- */
  .section {
    margin-top: 56px;
  }
  .section-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 20px;
  }
  .section-head h2 {
    font-family: ${t.font.serif};
    font-weight: 500;
    font-size: 26px;
    color: ${t.color.text};
  }
  .section-head .note {
    font-size: 12px;
    color: ${t.color.textFaint};
  }
  .section-head .more {
    font-size: 13px;
    color: ${t.color.accent};
    letter-spacing: 0.03em;
    text-decoration: none;
  }
  .section-head .more:hover {
    text-decoration: underline;
  }

  .card {
    ${cardSurface};
    color: inherit;
    text-decoration: none;
    display: block;
  }

  /* ---------- Your trips ---------- */
  .trips {
    display: grid;
    grid-template-columns: 1fr 1fr 0.7fr;
    gap: 16px;
  }
  .trip {
    padding: 22px 22px 18px;
    display: flex;
    flex-direction: column;
  }
  .trip .badge {
    align-self: flex-start;
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: ${t.color.badgeText};
    background: ${t.color.badgeBg};
    border-radius: 6px;
    padding: 4px 10px;
    margin-bottom: 12px;
  }
  .trip h3 {
    font-family: ${t.font.serif};
    font-weight: 500;
    font-size: 20px;
    color: ${t.color.text};
    margin-bottom: 12px;
  }
  .trip .tmeta {
    display: flex;
    gap: 16px;
    font-size: 13px;
    color: ${t.color.textFaint};
  }
  .trip .open {
    margin-top: auto;
    padding-top: 18px;
    font-size: 13px;
    color: ${t.color.accent};
    letter-spacing: 0.03em;
  }
  .trip-new {
    border: 1px dashed ${t.color.border2};
    border-radius: ${t.radius.lg};
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: ${t.color.textMuted};
    cursor: pointer;
    transition: background 0.2s;
    text-decoration: none;
    min-height: 160px;
  }
  .trip-new:hover {
    background: rgba(255, 255, 255, 0.03);
  }
  .trip-new span {
    font-size: 13px;
    letter-spacing: 0.03em;
  }

  /* ---------- Entry cards ---------- */
  .entries {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .entry {
    padding: 28px 26px 24px;
  }
  .entry > svg {
    color: ${t.color.accent};
  }
  .entry h3 {
    font-family: ${t.font.serif};
    font-weight: 500;
    font-size: 22px;
    color: ${t.color.text};
    margin: 14px 0 7px;
  }
  .entry p {
    font-size: 14px;
    color: ${t.color.textMuted};
  }
  .entry .go {
    display: inline-block;
    margin-top: 16px;
    font-size: 13px;
    color: ${t.color.accent};
    letter-spacing: 0.03em;
  }

  /* ---------- Featured ---------- */
  .featured {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  .story {
    overflow: hidden;
  }
  .story .thumb {
    height: 150px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.45);
  }
  .story .body {
    padding: 16px 18px 20px;
  }
  .story h3 {
    font-family: ${t.font.serif};
    font-weight: 500;
    font-size: 17px;
    color: ${t.color.text};
    line-height: 1.4;
    margin-bottom: 10px;
  }
  .story .smeta {
    font-size: 12px;
    color: ${t.color.textFaint};
  }

  /* ---------- Toolkit ---------- */
  .toolkit {
    background: ${t.color.surface2};
    border: 0.5px solid ${t.color.border};
    border-radius: ${t.radius.lg};
    padding: 28px 30px;
  }
  .toolkit .kicker {
    font-size: 12px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: ${t.color.accent};
    margin-bottom: 5px;
  }
  .toolkit .lede {
    font-size: 14px;
    color: ${t.color.textMuted};
    margin-bottom: 22px;
  }
  .tiles {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
  }
  .tile {
    background: ${t.color.surface3};
    border: 0.5px solid ${t.color.border};
    border-radius: ${t.radius.md};
    padding: 18px 18px 16px;
  }
  .tile > svg {
    color: #aebcab;
  }
  .tile h4 {
    font-size: 15px;
    font-weight: 500;
    color: #e3e6e0;
    margin: 11px 0 5px;
  }
  .tile p {
    font-size: 13px;
    color: ${t.color.textFaint};
    line-height: 1.5;
  }
  .tile .where {
    display: inline-block;
    margin-top: 12px;
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: ${t.color.textMuted};
    border: 0.5px solid ${t.color.border2};
    border-radius: 6px;
    padding: 3px 9px;
  }

  /* ---------- Page-load reveal (staggered) ---------- */
  .reveal {
    opacity: 0;
    animation: ${fadeUp} 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
  }
  .d1 { animation-delay: 0.05s; }
  .d2 { animation-delay: 0.15s; }
  .d3 { animation-delay: 0.25s; }
  .d4 { animation-delay: 0.35s; }
  .d5 { animation-delay: 0.45s; }

  @media (prefers-reduced-motion: reduce) {
    .reveal {
      animation: none;
      opacity: 1;
    }
  }

  /* ---------- Responsive ---------- */
  @media (max-width: 860px) {
    .wrap {
      padding: 0 20px;
    }
    .hero h1 {
      font-size: 36px;
    }
    .hero {
      padding: 52px 22px 42px;
    }
    .trips,
    .entries,
    .featured,
    .tiles {
      grid-template-columns: 1fr;
    }
  }
`;
