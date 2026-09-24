// 사이트 공용 footer — 문의 메일(contact@nadeliv.com) 링크 + 카피라이트.
// HeaderLayout 과 같은 규칙으로 라우트별 다크/라이트 톤을 고른다.
import React from "react";
import { Box, HStack, Link, Text } from "@chakra-ui/react";
import { Mail } from "lucide-react";
import { useLocation } from "react-router-dom";
import { homeTokens } from "../../../component/page/MainPage/MainBody/homeTokens";

const t = homeTokens;

export const CONTACT_EMAIL = "contact@nadeliv.com";

// MainLayout / HeaderLayout 의 DARK_ROUTE_PREFIXES 와 동기화
const DARK_ROUTE_PREFIXES = ["/blog", "/travel", "/profile", "/user", "/admin"];

type FooterVariant = "dark" | "light";

const FOOTER_TOKENS: Record<FooterVariant, { text: string; muted: string; divider: string; accent: string }> = {
  dark: {
    text: t.color.textSoft,
    muted: t.color.textFaint,
    divider: t.color.border,
    accent: t.color.accent,
  },
  light: {
    text: "gray.700",
    muted: "gray.500",
    divider: "gray.200",
    accent: t.color.accentStrong,
  },
};

function resolveFooterVariant(pathname: string): FooterVariant {
  if (pathname === "/" || pathname === "/home") return "dark";
  return DARK_ROUTE_PREFIXES.some((p) => pathname.startsWith(p)) ? "dark" : "light";
}

function FooterLayout() {
  const { pathname } = useLocation();
  const c = FOOTER_TOKENS[resolveFooterVariant(pathname)];

  return (
    <Box
      as="footer"
      w="100%"
      borderTop="1px solid"
      borderTopColor={c.divider}
      mt="auto"
    >
      <HStack
        maxW={t.containerMaxW}
        mx="auto"
        px={{ base: 4, md: 6 }}
        py={5}
        justify="space-between"
        flexWrap="wrap"
        gap={3}
        fontFamily={t.font.sans}
      >
        <Text fontSize="12px" color={c.muted}>
          © {new Date().getFullYear()} nadeliv · Discover the Korea beyond Seoul
        </Text>
        <Link
          href={`mailto:${CONTACT_EMAIL}`}
          fontSize="12.5px"
          color={c.text}
          display="inline-flex"
          alignItems="center"
          gap={1.5}
          _hover={{ color: c.accent, textDecoration: "none" }}
        >
          <Mail size={13} />
          Contact · {CONTACT_EMAIL}
        </Link>
      </HStack>
    </Box>
  );
}

export default FooterLayout;
