import {Route, Routes} from "react-router-dom";
import styled from "styled-components";
import MenuAdmin from "../../component/page/menu/admin/MenuAdmin";
import FolderManagement from "../../component/page/menu/admin/FolderAdmin/FolderManagement";
import FeatureAdminDashboard from "../../component/page/admin/Feature/FeaturedAdminDashboard";
import UsersAdmin from "../../component/page/admin/Users/UsersAdmin";
import InquiriesAdmin from "../../component/page/admin/Inquiries/InquiriesAdmin";
import ProtectedRoute from "../ProtectedRoute";
import MainLayout from "../../common/layout/MainLayout/MainLayout";
import AdminTabLayout from "../../common/layout/TabLayout";

export default function AdminRoutes() {
  return (
    <ProtectedRoute requiredRoles={["admin"]}>
      <StyledAdminRoutes>
        <MainLayout showHero={false}>
          <AdminTabLayout>
            <Routes>
              <Route path="/menu" element={<MenuAdmin />} />
              <Route path="/users" element={<UsersAdmin />} />
              <Route path="/inquiries" element={<InquiriesAdmin />} />
              <Route path="/folder" element={<FolderManagement />} />
              <Route path="/feature" element={<FeatureAdminDashboard />} />
            </Routes>
          </AdminTabLayout>
        </MainLayout>
      </StyledAdminRoutes>
    </ProtectedRoute>
  )
}

const StyledAdminRoutes = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
`;
