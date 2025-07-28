// lib/authState.js
"use server";

import { cookies } from "next/headers";
import { UserAuthInfo, UserRole } from "./definition";

const isValidUserRole = (value: string | undefined): value is UserRole => {
  return Object.values(UserRole).includes(value as UserRole);
};

export const loginStatus = async (): Promise<boolean> => {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  return !!refreshToken;
};

export const hasAdminRole = async (): Promise<boolean> => {
  const user = await userStatus();
  return user.role === UserRole.ADMIN;
};

export const userStatus = async (): Promise<UserAuthInfo> => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return {
      name: "",
      nickname: "",
      email: "",
      role: null,
    };
  }

  const userCookie = cookieStore.get("user")?.value;

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
