// lib/authState.js
import { cookies } from "next/headers";
import { UserAuthInfo, UserRole } from "./definition";

const isValidUserRole = (value: string | undefined): value is UserRole => {
  return Object.values(UserRole).includes(value as UserRole);
};

export const loginStatus = async (): Promise<boolean> => {
  const cookieStore = await cookies();
  const access_token = cookieStore.get("access_token")?.value;
  return !!access_token;
};

export const userStatus = async (): Promise<UserAuthInfo> => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  // 1. 엑세스 토큰이 없는 경우 기본값 반환
  if (!accessToken) {
    return {
      name: "",
      nickname: "",
      email: "",
      role: null,
    };
  }

  // 2. 사용자 정보 쿠키 파싱 (단일 쿠키 사용 권장)
  const userCookie = cookieStore.get("user")?.value;

  // 3. 유효성 검사 및 기본값 처리
  try {
    if (userCookie) {
      const userData = JSON.parse(userCookie);
      return {
        name: userData.name ?? "",
        nickname: userData.nickname ?? "",
        email: userData.email ?? "",
        role: isValidUserRole(userData.role) ? userData.role : null,
      };
    }
  } catch (error) {
    console.error("Failed to parse user cookie:", error);
  }

  // 4. 쿠키 불일치 시 기본값 반환
  return {
    name: "",
    nickname: "",
    email: "",
    role: null,
  };
};

// 인증 상태 초기화 함수
export const clearAuth = async () => {
  const cookieStore = await cookies();
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
  cookieStore.delete("user");
};
