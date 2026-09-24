import {MouseEventHandler, useCallback, useEffect, useState} from "react";
import {getAllMenus} from "../../../endpoints/menus-endpoints";
import {useRecoilState} from "recoil";
import recoil from "../../../stores/recoil";
import {useLocation, useNavigate, useParams} from "react-router-dom";
import { TabItem } from "../../elements/CusTab/CusTab";
import {AdminMenuTabProps} from "./TabLayout";
import {UserMenuTabProps} from "./UserTabLayout";

function useTabLayout(props : AdminMenuTabProps | UserMenuTabProps) {
  const [errorMsg, setErrorMsg] = useRecoilState(recoil.errMsg);
  const navigate = useNavigate();
  const location = useLocation();
  
  // 전체 경로에서 마지막 부분만 추출
  const currentPath = location.pathname.split('/').pop();
  
  // TabItem[] 타입으로 변경하고 value를 경로 기반으로 설정
  const [adminTabList, setAdminTabList] = useState<TabItem[]>([
    {
      label: "Menus",
      value: "menu", // 경로의 마지막 부분과 일치하도록 설정
    },
    {
      label: "Users",
      value: "users",
    },
    {
      label: "Folders",
      value: "folder",
    },
    {
      label: "Featured",
      value: "feature",
    },
    {
      label: "Inquiries",
      value: "inquiries",
    }
  ]);
  
  const [userTabList, setUserTabList] = useState<TabItem[]>([
    {
      label: "Folders",
      value: "folder",
    },
  ])
  
  // 메뉴 클릭 이벤트 - 이제 string value를 받습니다
  const handleChangeAdminTab = useCallback((value: string) => {
    console.log("Tab changed to value:", value);
    
    switch (value) {
      case "menu":
        navigate("/admin/menu");
        break;
      case "users":
        navigate("/admin/users");
        break;
      case "folder":
        navigate("/admin/folder");
        break;
      case "feature":
        navigate("/admin/feature");
        break;
      case "inquiries":
        navigate("/admin/inquiries");
        break;
      default:
        break;
    }
  }, [navigate]);
  
  // 메뉴 클릭 이벤트 - 이제 string value를 받습니다
  const handleChangeUserTab = useCallback((value: string) => {
    console.log("Tab changed to value:", value);
    
    switch (value) {
      case "folder":
        navigate("/user/folder");
        break;
      default:
        break;
    }
  }, [navigate]);
  
  return {
    adminTabList,
    userTabList,
    handleChangeAdminTab,
    handleChangeUserTab,
    currentPath,
  }
}

export default useTabLayout;