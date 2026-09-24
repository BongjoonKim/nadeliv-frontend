import {ReactNode} from "react";
import useTabLayout from "./useTabLayout";
import {
  AdminShell,
  AdminInner,
  Eyebrow,
  PageTitle,
  PageSub,
  TabBar,
  TabButton,
} from "../../../component/page/admin/adminUi";

export interface AdminMenuTabProps {
  children : ReactNode;
}

// 탭별 서브 카피 (헤더 아래 한 줄 설명)
const TAB_SUBTITLES: Record<string, string> = {
  menu: "사이트 상단 메뉴 항목을 만들고 순서·경로를 관리합니다.",
  users: "가입한 사용자 목록을 조회하고 권한을 관리합니다.",
  folder: "블로그 글이 담기는 폴더 구조를 관리합니다.",
  feature: "홈 화면에 노출할 Featured 콘텐츠를 관리합니다.",
  inquiries: "contact@nadeliv.com 으로 들어온 문의 메일을 확인합니다.",
};

function AdminTabLayout(props : AdminMenuTabProps) {
  const {
    adminTabList,
    handleChangeAdminTab,
    currentPath,
  } = useTabLayout(props);

  // currentPath와 일치하는 탭을 활성 탭으로 (없으면 첫 탭)
  const activeTab =
    adminTabList.find((tab) => tab.value === currentPath) || adminTabList[0];

  return (
    <AdminShell>
      <AdminInner>
        <Eyebrow>Nadeliv Admin</Eyebrow>
        <PageTitle>{activeTab?.label}</PageTitle>
        <PageSub>{TAB_SUBTITLES[activeTab?.value ?? ""] ?? ""}</PageSub>

        <TabBar aria-label="Admin sections">
          {adminTabList.map((tab) => (
            <TabButton
              key={tab.value}
              type="button"
              $active={tab.value === activeTab?.value}
              onClick={() => handleChangeAdminTab(tab.value)}
            >
              {tab.label}
            </TabButton>
          ))}
        </TabBar>

        {props.children}
      </AdminInner>
    </AdminShell>
  );
}

export default AdminTabLayout;
