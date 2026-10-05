import { useEffect } from "react";

const DEFAULT_TITLE = "Nadeliv — Find, Plan, and Keep Every Journey";
const DEFAULT_LANG = "en";

export interface PageMetaAlternate {
  hrefLang: string; // "ko" | "en" | "zh" | "ja" | "x-default"
  href: string;     // 절대 URL
}

export interface PageMetaOptions {
  // 실제 표시 중인 콘텐츠 언어 → <html lang> 반영 (검색엔진 언어 판별 근거)
  lang?: string;
  // 이 페이지의 대표 URL (절대 URL). 번역이 없어 원본을 fallback 표시할 때는 원본 URL 지정
  canonicalUrl?: string;
  // 언어별 대체 버전 목록 (자기 자신 포함)
  alternates?: PageMetaAlternate[];
}

// data-page-meta 마킹된 태그만 관리 (index.html 정적 태그와 충돌 방지)
const MANAGED_ATTR = "data-page-meta";

function removeManagedLinks(rel: string) {
  window.document
    .querySelectorAll(`link[rel="${rel}"][${MANAGED_ATTR}]`)
    .forEach((el) => el.remove());
}

/**
 * 페이지별 SEO 메타(브라우저 타이틀 + meta description + canonical/hreflang/lang) 설정 훅.
 * CSR 환경에서 Googlebot 렌더링 시 페이지별 메타가 인덱싱되도록 한다.
 * 언마운트 시 기본값으로 복원.
 */
export function usePageMeta(
  title?: string,
  description?: string,
  options?: PageMetaOptions
) {
  const { lang, canonicalUrl, alternates } = options ?? {};

  useEffect(() => {
    if (title) {
      window.document.title = `${title} | Nadeliv`;
    }
    return () => {
      window.document.title = DEFAULT_TITLE;
    };
  }, [title]);

  useEffect(() => {
    if (!description) return;

    const meta = window.document.querySelector<HTMLMetaElement>(
      'meta[name="description"]'
    );
    if (!meta) return;

    const original = meta.content;
    // HTML 태그 제거 후 앞 160자만 사용
    const plain = description.replace(/<[^>]*>/g, "").trim().slice(0, 160);
    if (plain) {
      meta.content = plain;
    }
    return () => {
      meta.content = original;
    };
  }, [description]);

  // <html lang> — 표시 중인 콘텐츠의 실제 언어
  useEffect(() => {
    if (!lang) return;
    window.document.documentElement.lang = lang;
    return () => {
      window.document.documentElement.lang = DEFAULT_LANG;
    };
  }, [lang]);

  // canonical — 페이지 대표 URL (locale fallback 시 중복 색인 방지)
  useEffect(() => {
    if (!canonicalUrl) return;

    removeManagedLinks("canonical");
    const link = window.document.createElement("link");
    link.rel = "canonical";
    link.href = canonicalUrl;
    link.setAttribute(MANAGED_ATTR, "true");
    window.document.head.appendChild(link);

    return () => {
      removeManagedLinks("canonical");
    };
  }, [canonicalUrl]);

  // hreflang alternates — 언어 버전 간 상호 참조 (검색 결과 언어 섞임 방지)
  useEffect(() => {
    if (!alternates || alternates.length === 0) return;

    removeManagedLinks("alternate");
    alternates.forEach(({ hrefLang, href }) => {
      const link = window.document.createElement("link");
      link.rel = "alternate";
      link.hreflang = hrefLang;
      link.href = href;
      link.setAttribute(MANAGED_ATTR, "true");
      window.document.head.appendChild(link);
    });

    return () => {
      removeManagedLinks("alternate");
    };
    // alternates 배열은 매 렌더 새 참조가 될 수 있어 직렬화 키로 비교
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(alternates)]);
}

export default usePageMeta;
