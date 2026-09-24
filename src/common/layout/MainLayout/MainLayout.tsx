import React, { ReactNode, useEffect } from "react";
import HeaderLayout from "./HeaderLayout";
import { Box } from "@chakra-ui/react";
import HeroSection from "./HeroSection";
import FooterLayout from "./FooterLayout";
import { Outlet, useLocation } from "react-router-dom";


export interface MainLayoutProps {
  children?: ReactNode;
  showHero?: boolean; // 홈페이지에서만 true
}

// 라우트별 페이지 톤. HeaderLayout 의 resolveHeaderVariant 와 일치시켜야 함.
const DARK_ROUTE_PREFIXES = ["/blog", "/travel", "/profile", "/user", "/admin"];

// 채팅 류는 viewport 에 strictly 맞춰야 한다(내부 스크롤 구조).
const VIEWPORT_LOCKED_PREFIXES = ["/travel/chat", "/chat"];

function resolvePageBg(pathname: string): string {
  // 홈("/")도 다크 세이지-그린 에디토리얼 테마
  if (pathname === "/" || pathname === "/home") return "#0a0b0a";
  return DARK_ROUTE_PREFIXES.some((p) => pathname.startsWith(p))
    ? "#0a0c0c"
    : "white";
}

function MainLayout({ children, showHero = false }: MainLayoutProps) {
  const { pathname } = useLocation();
  const pageBg = resolvePageBg(pathname);
  const isViewportLocked = VIEWPORT_LOCKED_PREFIXES.some((p) =>
    pathname.startsWith(p),
  );

  // 채팅 라우트에서는 sub-pixel 누적으로 인한 body 1px 스크롤을 차단.
  // 100dvh 과 window.innerHeight 의 0.5px 오차가 visible scrollbar 를 만든다.
  useEffect(() => {
    if (!isViewportLocked) return;
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [isViewportLocked]);

  return (
    // 일반 라우트: minH=100vh 로 컨텐츠 따라 자라게(긴 페이지 bg 끊김 방지).
    // 채팅 류: 정확히 viewport 에 맞추고 overflow hidden 으로 페이지 스크롤 차단,
    //          내부 스크롤 컨테이너가 처리하도록.
    <Box
      minH={isViewportLocked ? undefined : "100vh"}
      h={isViewportLocked ? "100dvh" : undefined}
      maxH={isViewportLocked ? "100dvh" : undefined}
      overflow={isViewportLocked ? "hidden" : undefined}
      display="flex"
      flexDirection="column"
      bg={pageBg}
    >
      <HeaderLayout />
      {showHero && <HeroSection />}
      <Box flex={1} minH={0} display="flex" flexDirection="column">
        {children ?? <Outlet/>}
      </Box>
      {/* 채팅 류(viewport 고정)는 footer 가 내부 스크롤 영역을 잠식하므로 제외 */}
      {!isViewportLocked && <FooterLayout />}
    </Box>
  );
}

export default MainLayout;