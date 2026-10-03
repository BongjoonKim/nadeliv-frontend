import React, {Suspense} from "react";
import {Route, Routes} from "react-router-dom";
import MainLayout from "../../common/layout/MainLayout/MainLayout";
import styled from "styled-components";
import TravelHomeMain from "../../component/page/travel/TravelHome/TravelHomeMain";
import TravelCreateProject from "../../component/page/travel/TravelCreateProject";
import TravelDashboard from "../../component/page/travel/TravelDashboard";
import TravelChat from "../../component/page/travel/TravelChat";
import ProtectedRoute from "../ProtectedRoute";

// 지도 경계 데이터(~120KB)가 초기 번들에 포함되지 않도록 lazy 로드
const TravelMap = React.lazy(() => import("../../component/page/travel/TravelMap"));
// 네이버 지도 위젯 포함 — lazy 로드
const TravelCourse = React.lazy(() => import("../../component/page/travel/TravelCourse"));
// 유튜브 수집·요약 플러그인 — lazy 로드
const TravelDiscovery = React.lazy(() => import("../../component/page/travel/TravelDiscovery"));
// 프로젝트 앨범 전용 화면 — lazy 로드
const TravelAlbumPage = React.lazy(() => import("../../component/page/travel/TravelAlbumPage"));

export default function TravelRoutes() {
  return (
    <StyledTravelRoutes>
      <Routes>
        {/* MainLayout이 필요한 라우트들 */}
        <Route element={<MainLayout showHero={false} />}>
          {/* 비로그인 허용 */}
          <Route path="/home" element={<TravelHomeMain />} />
          {/* 비로그인 허용 — 캐시된 다이제스트는 누구나 조회, 수집 트리거만 로그인 필요 */}
          <Route path="/discovery" element={
            <Suspense fallback={null}>
              <TravelDiscovery />
            </Suspense>
          } />

          {/* 로그인 필요 */}
          <Route path="/create" element={
            <ProtectedRoute>
              <TravelCreateProject />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/:travelId" element={
            <ProtectedRoute>
              <TravelDashboard />
            </ProtectedRoute>
          } />
          <Route path="/album/:travelId" element={
            <ProtectedRoute>
              <Suspense fallback={null}>
                <TravelAlbumPage />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/chat/:travelId" element={
            <ProtectedRoute>
              <TravelChat />
            </ProtectedRoute>
          } />
          <Route path="/map/:travelId" element={
            <ProtectedRoute>
              <Suspense fallback={null}>
                <TravelMap />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/course/:travelId" element={
            <ProtectedRoute>
              <Suspense fallback={null}>
                <TravelCourse />
              </Suspense>
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </StyledTravelRoutes>
  )
}

const StyledTravelRoutes = styled.div`
    flex: 1;
    width: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
`;
