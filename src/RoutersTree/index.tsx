// RoutersTree/index.tsx
import {BrowserRouter as Router, Route, Routes} from "react-router-dom";
import BlogRoutes from "./BlogRoutes";
import SettingRoutes from "./SettingRoutes";
import {Alert, AlertContent, AlertDescription, AlertIndicator, AlertRoot, AlertTitle} from "@chakra-ui/react"; // AlertIcon → AlertIndicator
import ChatRoutes from "./ChatRoutes";
import MainPage from "../component/page/MainPage";
import LoginRoutes from "./LoginRoutes/LoginRoutes";
import MainLayout from "../common/layout/MainLayout/MainLayout";
import TravelUploadTray from "../common/widget/TravelUploadTray";
import HomePage from "../component/page/homePage/HomePage";
import AdminRoutes from "./AdminRoutes";
import ForbiddenPage from "../component/page/error/ForbiddenPage";
import UserRoutes from "./UserRoutes";
import ProfileRoutes from "./ProfileRoutes";
import TravelRoutes from "./TravelRoutes";
import usePageViewTracking from "../hooks/usePageViewTracking";

// 라우트 전환마다 $pageview 캡처 (useLocation은 Router 내부에서만 동작)
function PageViewTracker() {
  usePageViewTracking();
  return null;
}

export default function RoutersTree() {
  return (
    <Router>
        <PageViewTracker/>
        {/* Travel 앨범 업로드는 페이지를 옮겨도 이어지도록 라우터 전역에서 처리 */}
        <TravelUploadTray/>
        <Routes>
            <Route path="/*" element={<MainPage/>}/>
            <Route path="/blog/*" element={<BlogRoutes/>}/>
            <Route path="/chat/*" element={<ChatRoutes/>}/>
            <Route path="/login/*" element={<LoginRoutes/>}/>
            <Route path="/travel/*" element={<TravelRoutes/>}/>
          <Route path="/profile/*" element={<ProfileRoutes />} />
          <Route path="/admin/*" element={<AdminRoutes />} />
          <Route path="/user/*" element={<UserRoutes />} />
          <Route path="/error/403" element={<ForbiddenPage />} />
          <Route path="*" element={
            <AlertRoot status="error">
              <AlertIndicator /> {/* AlertIcon → AlertIndicator */}
              <AlertContent>
                <AlertTitle>404 - 페이지를 찾을 수 없습니다!</AlertTitle>
                <AlertDescription>
                  요청하신 페이지가 존재하지 않습니다.
                </AlertDescription>
              </AlertContent>
            </AlertRoot>
          }/>
        </Routes>
    </Router>
  );
}