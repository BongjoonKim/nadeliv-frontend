// 개인정보 처리방침 페이지 (/privacy). 웹·iOS 앱 공용, App Store 심사의 Privacy Policy URL.
// 톤은 프로필 화면과 같은 다크 세이지-그린 에디토리얼(profileUi 빌딩블록 재사용).
import React, { useState } from "react";
import styled from "styled-components";
import { useAtomValue } from "jotai";
import MainLayout from "../../../common/layout/MainLayout/MainLayout";
import { usePageMeta } from "../../../hooks/usePageMeta";
import { preferredLocaleAtom, detectBrowserLocale } from "../../../stores/jotai/localeAtom";
import { homeTokens as t } from "../MainPage/MainBody/homeTokens";
import {
  Page,
  Inner,
  Eyebrow,
  PageTitle,
  PageSub,
  TabBar,
  TabButton,
} from "../profile/profileUi";
import {
  privacyPolicyContent,
  PRIVACY_CONTACT_EMAIL,
  type PolicyLocale,
} from "./privacyPolicyContent";

const LOCALE_LABEL: Record<PolicyLocale, string> = { en: "English", ko: "한국어" };

const Article = styled.article`
  margin-top: 28px;
  color: ${t.color.textSoft};
  font-size: 15px;
  line-height: 1.75;

  p {
    margin: 0 0 12px;
  }
`;

const Section = styled.section`
  padding: 22px 0;
  border-top: 1px solid ${t.color.border};
`;

const SectionHeading = styled.h2`
  font-family: ${t.font.serif};
  font-weight: 500;
  font-size: 20px;
  line-height: 1.3;
  color: ${t.color.text};
  margin: 0 0 10px;
`;

// 전역 reset 이 list-style 을 지우므로 명시적으로 복원한다.
const List = styled.ul`
  list-style: disc outside;
  margin: 4px 0 12px;
  padding-left: 20px;

  li {
    display: list-item;
    margin-bottom: 6px;
  }

  li::marker {
    color: ${t.color.accent};
  }
`;

const ContactBox = styled.div`
  margin-top: 8px;
  padding: 18px 20px;
  border-radius: ${t.radius.lg};
  background: ${t.color.surface};
  border: 1px solid ${t.color.border};

  a {
    color: ${t.color.accent};
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }
`;

function initialLocale(stored: string | null): PolicyLocale {
  const pick = stored ?? detectBrowserLocale();
  return pick === "ko" ? "ko" : "en";
}

export default function PrivacyPolicyPage() {
  const preferred = useAtomValue(preferredLocaleAtom);
  const [locale, setLocale] = useState<PolicyLocale>(() => initialLocale(preferred));
  const doc = privacyPolicyContent[locale];

  usePageMeta(doc.title, doc.intro[0], { lang: locale });

  return (
    <MainLayout showHero={false}>
      <Page>
        <Inner>
          <Eyebrow>Nadeliv · Legal</Eyebrow>
          <PageTitle>{doc.title}</PageTitle>
          <PageSub>{doc.effectiveLabel}</PageSub>

          <TabBar role="tablist" aria-label="Language">
            {(Object.keys(LOCALE_LABEL) as PolicyLocale[]).map((code) => (
              <TabButton
                key={code}
                type="button"
                role="tab"
                aria-selected={locale === code}
                $active={locale === code}
                onClick={() => setLocale(code)}
              >
                {LOCALE_LABEL[code]}
              </TabButton>
            ))}
          </TabBar>

          <Article lang={locale}>
            {doc.intro.map((p, i) => (
              <p key={i}>{p}</p>
            ))}

            {doc.sections.map((s) => (
              <Section key={s.heading}>
                <SectionHeading>{s.heading}</SectionHeading>
                {s.paragraphs?.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
                {s.bullets && (
                  <List>
                    {s.bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </List>
                )}
                {s.after?.map((p, i) => (
                  <p key={`after-${i}`}>{p}</p>
                ))}
              </Section>
            ))}

            <Section>
              <SectionHeading>{doc.contactHeading}</SectionHeading>
              <ContactBox>
                {doc.contactText.split(PRIVACY_CONTACT_EMAIL)[0]}
                <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>{PRIVACY_CONTACT_EMAIL}</a>
                {doc.contactText.split(PRIVACY_CONTACT_EMAIL)[1]}
              </ContactBox>
            </Section>
          </Article>
        </Inner>
      </Page>
    </MainLayout>
  );
}
