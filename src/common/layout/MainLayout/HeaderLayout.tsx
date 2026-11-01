import React from "react";
import { Box, Flex, Container } from "@chakra-ui/react";
import { useLocation } from "react-router-dom";
import LeftHeader from "./LeftHeader";
import RightHeader from "./RightHeader";

export type HeaderVariant = "light" | "dark";

const HEADER_TOKENS: Record<HeaderVariant, { bg: string; divider: string }> = {
  light: { bg: "white", divider: "transparent" },
  // BlogPage StyledShell(#0a0c0c) 과 동일한 값
  dark: { bg: "#0a0c0c", divider: "rgba(255, 255, 255, 0.06)" },
};

// 라우트별 헤더 톤. MainLayout 의 DARK_ROUTE_PREFIXES 와 일치시켜야 함.
const DARK_ROUTE_PREFIXES = ["/blog", "/travel", "/profile", "/user", "/admin", "/privacy"];
function resolveHeaderVariant(pathname: string): HeaderVariant {
  // 홈("/")도 다크 세이지-그린 에디토리얼 테마
  if (pathname === "/" || pathname === "/home") return "dark";
  return DARK_ROUTE_PREFIXES.some((p) => pathname.startsWith(p)) ? "dark" : "light";
}

function HeaderLayout() {
  const { pathname } = useLocation();
  const variant = resolveHeaderVariant(pathname);
  const { bg, divider } = HEADER_TOKENS[variant];

  return (
    <Box
      w={"100%"}
      top="0"
      display="flex"
      justifyContent="center"
      bg={bg}
      borderBottom="1px solid"
      borderBottomColor={divider}
    >
      <Box
        as="header"
        bg={bg}
        position="sticky"
        zIndex={"999"}
        maxW="7xl"
        w="100%"  // 추가: 전체 너비 사용
      >
        <Container maxW="7xl" px={{ base: 4, md : 4, lg : 4}}>
          <Flex h="16" align="center" justify="space-between" padding={"0.5rem 0"}>
            <LeftHeader variant={variant} />
            <RightHeader variant={variant} />
          </Flex>
        </Container>
      </Box>
    </Box>

  );
}

export default HeaderLayout;