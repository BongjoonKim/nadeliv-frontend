// /home 다크 세이지-그린 에디토리얼 디자인 토큰
// 컴포넌트에서 hex 를 직접 쓰지 말고 항상 이 토큰을 참조한다.
// design ref: nadeliv-home.design.jsonc, nadeliv-home.html

export const homeTokens = {
  color: {
    bg: "#0a0b0a",
    surface: "#141714",
    surface2: "#101210",
    surface3: "#181b18",
    border: "rgba(255, 255, 255, 0.08)",
    border2: "rgba(255, 255, 255, 0.18)",
    text: "#f3f4f1",
    textSoft: "#cdd6c5",
    textMuted: "#9aa399",
    textFaint: "#7e857d",
    heroTop: "#6a7d68",
    heroMid: "#46553f",
    heroBottom: "#28321f",
    heroGradient:
      "linear-gradient(165deg, #6a7d68 0%, #46553f 42%, #28321f 100%)",
    accent: "#8fbf94",
    accentStrong: "#2e7d52",
    badgeBg: "#243124",
    badgeText: "#bcd0bb",
  },
  // 여행 프로젝트 기본 썸네일(커버 사진 없음) — 프로젝트 id 해시로 하나를 고른다.
  // 다크 배경·흰 모달 양쪽에서 튀지 않도록 채도를 낮춘 흙·자연 톤.
  projectPalette: [
    "linear-gradient(135deg, #7a9a7e 0%, #3f5a45 100%)", // sage
    "linear-gradient(135deg, #5f9097 0%, #2f5a60 100%)", // teal
    "linear-gradient(135deg, #6f86ad 0%, #3b4d6e 100%)", // dusty blue
    "linear-gradient(135deg, #8f78a3 0%, #54436a 100%)", // plum
    "linear-gradient(135deg, #b07a86 0%, #6e4450 100%)", // rose
    "linear-gradient(135deg, #bb7f5f 0%, #74472f 100%)", // terracotta
    "linear-gradient(135deg, #c29d5e 0%, #7a5c2c 100%)", // ochre
    "linear-gradient(135deg, #93965c 0%, #575a2f 100%)", // olive
  ],
  font: {
    serif: "'Noto Serif KR', Georgia, serif",
    sans: "'Noto Sans KR', system-ui, sans-serif",
  },
  radius: {
    md: "10px",
    lg: "14px",
    pill: "999px",
  },
  containerMaxW: "1120px",
} as const;

export type HomeTokens = typeof homeTokens;
