// 개인정보 처리방침 본문 (웹 www.nadeliv.com + iOS 앱 공용).
// App Store 심사 제출용 Privacy Policy URL(https://www.nadeliv.com/privacy) 이 이 페이지를 가리킨다.
// 수집 항목·처리 위탁처가 바뀌면 여기와 App Store Connect 의 "앱 개인정보" 신고를 함께 갱신할 것.

export type PolicyLocale = "en" | "ko";

export interface PolicySection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  // bullets 뒤에 붙는 문단
  after?: string[];
}

export interface PolicyDocument {
  title: string;
  effectiveLabel: string;
  intro: string[];
  sections: PolicySection[];
  contactHeading: string;
  contactText: string;
}

export const PRIVACY_EFFECTIVE_DATE = "2026-11-01";
export const PRIVACY_CONTACT_EMAIL = "contact@nadeliv.com";

const en: PolicyDocument = {
  title: "Privacy Policy",
  effectiveLabel: `Effective ${PRIVACY_EFFECTIVE_DATE}`,
  intro: [
    "Nadeliv (“we”, “us”) runs the website www.nadeliv.com and the Nadeliv iOS app. This policy explains what personal information we collect, why, who processes it on our behalf, and the choices you have.",
    "It applies to both the website and the app unless a section says otherwise.",
  ],
  sections: [
    {
      heading: "1. Information we collect",
      paragraphs: ["We only collect what the service needs to work."],
      bullets: [
        "Account details you give us: user ID, email address, password (stored only as a one-way hash), display name, birthday, and an optional profile photo.",
        "Content you create: blog posts, comments, likes, bookmarks, follows, travel projects (title, dates, members, itinerary, places), photos and videos you upload to a travel album, and messages in travel or site chat.",
        "Photo metadata: the capture time embedded in a photo (EXIF) is read so media can be sorted and grouped by day. The iOS app also reads capture dates from your photo library to show which photos are already uploaded; that comparison happens on your device.",
        "Location data you choose to import: if you import a location-history file (for example a Google Timeline export) to mark visited regions, the file is processed in your browser and only the resulting list of regions and places is saved.",
        "Usage and device data: IP address, browser or device type, pages viewed and actions taken, collected through server logs, Google Analytics, and PostHog. Post view counts keep a hashed IP for up to 24 hours only to avoid double counting.",
        "Support messages you send to our contact address.",
      ],
    },
    {
      heading: "2. How we use it",
      bullets: [
        "To create and secure your account, sign you in, and verify your email address.",
        "To show your travel albums, itineraries, posts, and chats to you and the people you share them with.",
        "To generate image thumbnails and web-sized copies so albums load quickly.",
        "To translate blog posts into other languages. Post text (not your account data) is sent to Amazon Translate or Amazon Bedrock for machine translation.",
        "To understand how the service is used and fix problems (analytics).",
        "To show advertising on the website (Google AdSense). The iOS app shows no ads.",
        "To respond to your questions and legal requests.",
      ],
      after: ["We do not sell your personal information and we do not use it for cross-app or cross-site tracking."],
    },
    {
      heading: "3. Cookies and local storage",
      bullets: [
        "Sign-in: a refresh token is stored in your browser’s local storage (website) or in the device Keychain (iOS app) so you stay signed in. Clearing it signs you out.",
        "Preferences: your chosen display language and similar settings.",
        "Analytics: Google Analytics and PostHog set their own identifiers to measure usage.",
        "Advertising: Google AdSense may set cookies on the website to serve and measure ads. You can manage ad personalisation at adssettings.google.com.",
      ],
      after: ["You can block or delete cookies in your browser. Parts of the website that require sign-in will not work without local storage."],
    },
    {
      heading: "4. Who processes data for us",
      paragraphs: ["We use the following service providers. Each one receives only what its function needs."],
      bullets: [
        "Amazon Web Services (Seoul region, ap-northeast-2): servers, database, file storage for photos and videos, email delivery, machine translation, and thumbnail generation.",
        "Google: Analytics (usage measurement) and AdSense (website advertising).",
        "PostHog: product analytics.",
        "Naver Maps and Kakao Maps: map display and place search. Your search text and map viewport are sent to them to return results.",
        "YouTube Data API: used to fetch public video information for destination guides. No account data is sent.",
        "Apple: TestFlight and App Store distribution of the iOS app, and crash reports if you opted in with Apple.",
      ],
      after: ["Some of these providers operate outside your country. Where that happens, we rely on their standard contractual safeguards."],
    },
    {
      heading: "5. Sharing with other people",
      bullets: [
        "Public blog posts, comments, and your display name and profile photo are visible to anyone.",
        "Travel albums, itineraries, and travel chats are visible to the members of that travel project.",
        "We disclose information to authorities only when the law requires it.",
      ],
    },
    {
      heading: "6. How long we keep it",
      bullets: [
        "Account details: until you delete your account.",
        "Content: until you delete it, or until the travel project it belongs to is deleted.",
        "Server logs and analytics data: up to 26 months.",
        "Email verification codes and view-count de-duplication records: 24 hours.",
      ],
    },
    {
      heading: "7. Deleting your account",
      paragraphs: [
        "You can delete your account at any time from Profile → Delete Account on the website or in the iOS app. No request to support is needed.",
        "When you do, your name, email, birthday, password, follows, and bookmarks are erased and your profile photo is unlinked. Posts, comments, and travel albums you shared stay available to the people you shared them with, attributed to “Deleted user”, so other members’ trips are not broken. You can delete individual posts or media before deleting your account if you want them gone.",
      ],
    },
    {
      heading: "8. Your choices and rights",
      bullets: [
        "View and edit your name, birthday, and profile photo in Profile.",
        "Change your password in Profile → Password.",
        "Ask us for a copy of your data, a correction, or deletion by emailing the address below. We answer within 30 days.",
        "iOS photo permission: the app asks for access to your photo library only when you pick photos to upload or save media to your library. You can change this at any time in iOS Settings → Nadeliv.",
        "Opt out of Google Analytics with the browser add-on at tools.google.com/dlpage/gaoptout.",
      ],
    },
    {
      heading: "9. iOS app permissions",
      bullets: [
        "Photo library (read): to let you choose photos and videos to upload and to mark the ones already uploaded. Only the items you select are uploaded.",
        "Photo library (add): to save album photos and videos back to your library when you ask.",
        "Background transfers: uploads continue after you leave the app so large videos finish.",
        "The app does not request location, contacts, microphone, or the advertising identifier.",
      ],
    },
    {
      heading: "10. Security",
      paragraphs: [
        "All traffic uses HTTPS. Passwords are stored as salted hashes and are never readable by us. Access to production systems is limited to the operator. No method is perfectly secure, so please use a unique password and contact us if you suspect misuse of your account.",
      ],
    },
    {
      heading: "11. Children",
      paragraphs: [
        "Nadeliv is not directed to children under 14 (or the minimum age in your country) and we do not knowingly collect their data. If you believe a child has created an account, contact us and we will delete it.",
      ],
    },
    {
      heading: "12. Changes to this policy",
      paragraphs: [
        "If we make material changes we will update the effective date above and, for significant changes, notify signed-in users on the website or by email.",
      ],
    },
  ],
  contactHeading: "Contact",
  contactText: `Privacy questions and requests: ${PRIVACY_CONTACT_EMAIL}`,
};

const ko: PolicyDocument = {
  title: "개인정보 처리방침",
  effectiveLabel: `시행일 ${PRIVACY_EFFECTIVE_DATE}`,
  intro: [
    "Nadeliv(나들이브, 이하 “서비스”)는 웹사이트 www.nadeliv.com 과 Nadeliv iOS 앱을 운영합니다. 이 방침은 어떤 개인정보를 왜 수집하는지, 누가 처리를 위탁받는지, 이용자가 어떤 선택을 할 수 있는지 설명합니다.",
    "별도 표시가 없는 한 웹사이트와 앱에 동일하게 적용됩니다.",
  ],
  sections: [
    {
      heading: "1. 수집하는 개인정보",
      paragraphs: ["서비스 운영에 필요한 정보만 수집합니다."],
      bullets: [
        "회원 정보: 아이디, 이메일 주소, 비밀번호(단방향 해시로만 저장), 표시 이름, 생년월일, 프로필 사진(선택).",
        "이용자가 만든 콘텐츠: 블로그 글, 댓글, 좋아요, 북마크, 팔로우, 여행 프로젝트(제목·기간·멤버·일정·장소), 여행 앨범에 올린 사진과 영상, 여행 채팅·사이트 채팅 메시지.",
        "사진 메타데이터: 사진에 포함된 촬영 시각(EXIF)을 읽어 날짜별로 정렬·묶음 표시합니다. iOS 앱은 이미 올린 사진을 표시하기 위해 사진 보관함의 촬영 시각을 읽으며, 이 비교는 기기 안에서만 이루어집니다.",
        "이용자가 직접 가져오는 위치 기록: 방문 지역 표시를 위해 위치 기록 파일(예: Google 타임라인 내보내기)을 가져오면 브라우저 안에서 처리되고, 결과로 나온 지역·장소 목록만 저장됩니다.",
        "이용·기기 정보: IP 주소, 브라우저·기기 종류, 조회한 페이지와 수행한 동작. 서버 로그, Google Analytics, PostHog 를 통해 수집됩니다. 글 조회수는 중복 집계를 막기 위해 해시된 IP 를 최대 24시간만 보관합니다.",
        "문의 메일로 보내주신 내용.",
      ],
    },
    {
      heading: "2. 이용 목적",
      bullets: [
        "회원 가입·로그인·계정 보호, 이메일 주소 인증.",
        "여행 앨범·일정·글·채팅을 본인과 공유 대상에게 표시.",
        "앨범을 빠르게 불러오기 위한 썸네일·웹용 축소본 생성.",
        "블로그 글의 다국어 번역. 글 본문(계정 정보 제외)이 Amazon Translate 또는 Amazon Bedrock 에 전달되어 기계 번역됩니다.",
        "서비스 이용 현황 파악과 오류 수정(분석).",
        "웹사이트 광고 게재(Google AdSense). iOS 앱에는 광고가 없습니다.",
        "문의 응대와 법령상 요청 대응.",
      ],
      after: ["개인정보를 판매하지 않으며, 앱·사이트를 넘나드는 추적(트래킹)에 사용하지 않습니다."],
    },
    {
      heading: "3. 쿠키와 로컬 저장소",
      bullets: [
        "로그인 유지: 리프레시 토큰을 브라우저 로컬 저장소(웹) 또는 기기 키체인(iOS 앱)에 저장합니다. 지우면 로그아웃됩니다.",
        "환경 설정: 선택한 표시 언어 등.",
        "분석: Google Analytics 와 PostHog 가 이용 측정을 위해 자체 식별자를 둡니다.",
        "광고: Google AdSense 가 웹사이트에서 광고 게재·측정용 쿠키를 둘 수 있습니다. 맞춤 광고는 adssettings.google.com 에서 관리할 수 있습니다.",
      ],
      after: ["브라우저에서 쿠키를 차단하거나 삭제할 수 있습니다. 다만 로컬 저장소 없이는 로그인이 필요한 기능이 동작하지 않습니다."],
    },
    {
      heading: "4. 처리 위탁 및 제3자 제공",
      paragraphs: ["아래 서비스 제공자에게 처리를 위탁하며, 각 업체는 해당 기능에 필요한 정보만 받습니다."],
      bullets: [
        "Amazon Web Services(서울 리전, ap-northeast-2): 서버, 데이터베이스, 사진·영상 파일 저장, 이메일 발송, 기계 번역, 썸네일 생성.",
        "Google: Analytics(이용 측정), AdSense(웹사이트 광고).",
        "PostHog: 제품 분석.",
        "네이버 지도·카카오 지도: 지도 표시와 장소 검색. 검색어와 지도 범위가 결과 조회를 위해 전달됩니다.",
        "YouTube Data API: 여행지 안내용 공개 영상 정보 조회. 계정 정보는 전달되지 않습니다.",
        "Apple: iOS 앱의 TestFlight·App Store 배포, 이용자가 Apple 에 동의한 경우 충돌 보고.",
      ],
      after: ["일부 제공자는 국외에서 운영됩니다. 이 경우 각 제공자의 표준 계약상 보호조치에 따릅니다."],
    },
    {
      heading: "5. 다른 이용자에게 공개되는 범위",
      bullets: [
        "공개 블로그 글, 댓글, 표시 이름, 프로필 사진은 누구나 볼 수 있습니다.",
        "여행 앨범·일정·여행 채팅은 해당 여행 프로젝트의 멤버에게만 보입니다.",
        "수사기관 등 제3자 제공은 법령에 근거한 요청이 있을 때만 합니다.",
      ],
    },
    {
      heading: "6. 보유 기간",
      bullets: [
        "회원 정보: 회원 탈퇴 시까지.",
        "콘텐츠: 이용자가 삭제하거나 소속된 여행 프로젝트가 삭제될 때까지.",
        "서버 로그·분석 데이터: 최대 26개월.",
        "이메일 인증 코드, 조회수 중복 방지 기록: 24시간.",
      ],
    },
    {
      heading: "7. 회원 탈퇴",
      paragraphs: [
        "웹사이트와 iOS 앱의 프로필 → 계정 삭제에서 언제든지 직접 탈퇴할 수 있습니다. 별도 문의가 필요 없습니다.",
        "탈퇴 시 이름, 이메일, 생년월일, 비밀번호, 팔로우, 북마크가 삭제되고 프로필 사진은 계정에서 분리됩니다. 공유했던 글·댓글·여행 앨범은 다른 멤버의 여행이 깨지지 않도록 “Deleted user” 명의로 공유 대상에게 계속 제공됩니다. 남기고 싶지 않은 글이나 미디어는 탈퇴 전에 개별 삭제할 수 있습니다.",
      ],
    },
    {
      heading: "8. 이용자의 권리와 선택",
      bullets: [
        "프로필에서 이름·생년월일·프로필 사진을 열람·수정할 수 있습니다.",
        "프로필 → 비밀번호에서 비밀번호를 변경할 수 있습니다.",
        "아래 이메일로 개인정보 열람·정정·삭제를 요청할 수 있으며 30일 이내에 답변합니다.",
        "iOS 사진 권한: 업로드할 사진을 고르거나 미디어를 보관함에 저장할 때만 권한을 요청합니다. iOS 설정 → Nadeliv 에서 언제든 변경할 수 있습니다.",
        "Google Analytics 수집 거부는 tools.google.com/dlpage/gaoptout 의 브라우저 부가기능으로 할 수 있습니다.",
      ],
    },
    {
      heading: "9. iOS 앱 권한",
      bullets: [
        "사진 보관함(읽기): 올릴 사진·영상을 고르고 이미 올린 항목을 표시하기 위해 사용합니다. 선택한 항목만 업로드됩니다.",
        "사진 보관함(추가): 요청 시 앨범의 사진·영상을 보관함에 저장하기 위해 사용합니다.",
        "백그라운드 전송: 앱을 벗어나도 대용량 영상 업로드가 끝까지 진행됩니다.",
        "위치, 연락처, 마이크, 광고 식별자는 요청하지 않습니다.",
      ],
    },
    {
      heading: "10. 안전성 확보 조치",
      paragraphs: [
        "모든 통신은 HTTPS 를 사용합니다. 비밀번호는 솔트가 적용된 해시로 저장되어 운영자도 읽을 수 없습니다. 운영 시스템 접근은 운영자로 제한됩니다. 완벽한 보안은 없으므로 고유한 비밀번호를 사용하시고, 계정 도용이 의심되면 연락 주십시오.",
      ],
    },
    {
      heading: "11. 아동의 개인정보",
      paragraphs: [
        "서비스는 만 14세 미만(또는 거주 국가의 최소 연령 미만) 아동을 대상으로 하지 않으며, 아동의 정보를 알면서 수집하지 않습니다. 아동이 계정을 만든 것으로 보이면 알려 주십시오. 확인 후 삭제합니다.",
      ],
    },
    {
      heading: "12. 방침의 변경",
      paragraphs: [
        "내용이 바뀌면 위 시행일을 갱신하고, 중요한 변경은 웹사이트 공지나 이메일로 로그인 이용자에게 알립니다.",
      ],
    },
  ],
  contactHeading: "개인정보 보호책임자 및 문의",
  contactText: `개인정보 관련 문의·요청: ${PRIVACY_CONTACT_EMAIL} (Nadeliv 운영자)`,
};

export const privacyPolicyContent: Record<PolicyLocale, PolicyDocument> = { en, ko };
