// src/hooks/useLoginPage.ts

import {ChangeEvent, useCallback, useEffect, useState, KeyboardEvent} from "react";
import {InitUsersDTO} from "../../../types/users/initialUsers";
import {useLocation, useNavigate} from "react-router-dom";
import {login} from "../../../endpoints/login-endpoints";
import {useRecoilState} from "recoil";
import recoil from "../../../stores/recoil";
import {useAuth} from "../../../appConfig/AuthProvider";
import {refreshTokenStorage} from "../../../appConfig/AuthProvider";
import {UsersDTO} from "../../../types/users/UsersDTO";

export default function useLoginPage() {
  const [userInfo, setUserInfo] = useState<UsersDTO>(InitUsersDTO);
  const [userId, setUserId] = useState<string>("");
  const [errMsg, setErrMsg] = useRecoilState(recoil.errMsg);

  const navigate = useNavigate();
  const location = useLocation();
  const {setAccessToken, refreshCurrentUserQuery} = useAuth();

  // ProtectedRoute에서 리다이렉트된 경우 안내 메시지 표시
  useEffect(() => {
    if (location.state?.from) {
      setErrMsg({
        status: "warning",
        msg: "Login is required to access this service. Please log in to continue.",
        isShow: true
      });
    }
  }, [location.state?.from, setErrMsg]);
  
  const handleChange = useCallback((event:ChangeEvent<HTMLInputElement>, type:string) => {
    if (type === "id") {
      setUserInfo((prev:any) => {
        return {
          ...prev,
          userId: event.target.value
        }
      })
    } else if (type === "password") {
      setUserInfo((prev:any) => {
        return {
          ...prev,
          userPassword: event.target.value
        }
      })
    }
  }, []);
  
  // 제목 누르기
  const handleClickTitle = useCallback(() => {
    navigate("/")
  }, [navigate]);
  
  // 로그인 버튼 클릭
  const handleClickLogin = useCallback(async () => {
    // 빈 값이면 백엔드로 요청 보내기 전에 막는다 (빈 요청 → 서버 401 "invalid username or password" 방지)
    if (!userInfo.userId?.trim() || !userInfo.userPassword?.trim()) {
      setErrMsg({
        status: "warning",
        msg: "Please enter your ID and password.",
        isShow: true
      });
      return;
    }

    try {
      const resToken = await login(userInfo);
      
      if (resToken.data) {
        // accessToken은 Context(메모리)에만 저장
        setAccessToken(resToken.data.accessToken);
        
        // refreshToken은 sessionStorage에만 저장
        refreshTokenStorage.set(resToken.data.refreshToken!);
        
        
        const fromWhere = location.state?.from || "/home"
        console.log("fromWhere", fromWhere)
        
        navigate(fromWhere);
        await refreshCurrentUserQuery(); // 명시적으로 사용자 정보 업데이트
        
      }
    } catch(e: any) {
      console.error("Login failed:", e);

      // 연속 실패로 아이디가 임시 잠긴 경우 (백엔드 429 + retryAfterSeconds)
      if (e.response?.status === 429) {
        const retryAfterSeconds: number | undefined = e.response?.data?.retryAfterSeconds;
        const minutes = retryAfterSeconds ? Math.max(1, Math.ceil(retryAfterSeconds / 60)) : 10;
        setErrMsg({
          status: "error",
          msg: `Too many failed login attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
          isShow: true
        });
        return;
      }

      setErrMsg({
        status: "error",
        msg: e.response?.data?.message || "Login failed. Please check your ID and password.",
        isShow: true
      });
    }
  }, [userInfo, setAccessToken, navigate, setErrMsg, refreshCurrentUserQuery]);
  
  const pressEnter = useCallback((event : KeyboardEvent) => {
    try {
      if (event?.key === 'Enter') {
        handleClickLogin();
      }
    } catch (e) {
      setErrMsg({
        status : "error",
        msg: "login fail"
      })
    }
  }, [handleClickLogin, setErrMsg]);
  
  const handleClickSignUp = useCallback(() => {
    navigate("/login/sign-up")
  }, [navigate]);
  
  return {
    userInfo,
    userId,
    errMsg,
    handleClickTitle,
    handleChange,
    handleClickLogin,
    handleClickSignUp,
    pressEnter
  }
}