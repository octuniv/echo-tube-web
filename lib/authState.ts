// lib/authState.js
import { cookies } from "next/headers";

export const loginStatus = async (): Promise<boolean> => {
  const cookieStore = await cookies();
  const access_token = cookieStore.get("access_token")?.value;
  return !!access_token;
};

interface userStatusProps {
  name: string;
  nickname: string;
  email: string;
}

export const userStatus = async (): Promise<userStatusProps> => {
  const cookieStore = await cookies();
  const access_token = cookieStore.get("access_token")?.value;
  if (!access_token) {
    return {
      name: "",
      nickname: "",
      email: "",
    };
  }
  const name = cookieStore.get("name")?.value;
  const nickname = cookieStore.get("nickname")?.value;
  const email = cookieStore.get("email")?.value;
  return {
    name: name ?? "",
    nickname: nickname ?? "",
    email: email ?? "",
  };
};

// 인증 상태 초기화 함수
export const clearAuth = async () => {
  const cookieStore = await cookies();
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
  cookieStore.delete("name");
  cookieStore.delete("nickname");
  cookieStore.delete("email");
};
