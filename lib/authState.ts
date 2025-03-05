// lib/authState.js
import { cache } from "react";
import { cookies } from "next/headers";
import { serverAddress } from "./util";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

type AuthResult = {
  isAuthenticated: boolean;
  message: string;
};

type UserInfo = {
  name?: string;
  nickName?: string;
  email?: string;
};

export type AuthInfo = AuthResult & UserInfo;

export const loginStatus = async (): Promise<boolean> => {
  const cookieStore = await cookies();
  const access_token = cookieStore.get("access_token")?.value;
  return !!access_token;
};

interface userStatusProps {
  name: string;
  nickName: string;
  email: string;
}

export const userStatus = async (): Promise<userStatusProps> => {
  const cookieStore = await cookies();
  const access_token = cookieStore.get("access_token")?.value;
  if (!access_token) {
    return {
      name: "",
      nickName: "",
      email: "",
    };
  }
  const name = cookieStore.get("name")?.value;
  const nickName = cookieStore.get("nickName")?.value;
  const email = cookieStore.get("email")?.value;
  return {
    name: name ?? "",
    nickName: nickName ?? "",
    email: email ?? "",
  };
};

const validateToken = async (access_token: string): Promise<boolean> => {
  const validateTokenApiAddress = serverAddress + "/auth/validate-token";
  try {
    const response = await fetch(validateTokenApiAddress, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (response.status === 401) {
      // 401 Unauthorized: 토큰이 만료되었거나 유효하지 않음
      return false;
    }

    if (!response.ok) {
      throw new Error("Failed to validate token");
    }
    const { valid } = await response.json();
    return valid;
  } catch (err) {
    console.error(err);
    return false;
  }
};

const refreshToken = async (
  refresh_token: string,
  cookieStore: ReadonlyRequestCookies
): Promise<AuthResult> => {
  const refreshTokenApiAddress = serverAddress + "/auth/refresh";
  try {
    const response = await fetch(refreshTokenApiAddress, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token }),
    });

    if (response.status === 401) {
      // 401 Unauthorized: refresh_token이 만료되었거나 유효하지 않음
      return {
        isAuthenticated: false,
        message: "Refresh token expired or invalid.",
      };
    }

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    const { access_token: new_access_token, refresh_token: new_refresh_token } =
      await response.json();

    const baseCookieOptions = {
      httpOnly: true,
      path: "/",
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      domain: process.env.COOKIE_DOMAIN || "localhost",
    };

    cookieStore.set("access_token", new_access_token, {
      ...baseCookieOptions,
      maxAge: 60 * 15,
    });
    cookieStore.set("refresh_token", new_refresh_token, {
      ...baseCookieOptions,
      maxAge: 60 * 60 * 24 * 7,
    });

    return { isAuthenticated: true, message: "Success validation!" };
  } catch (err) {
    console.error("Token refresh error:", err);
    return {
      isAuthenticated: false,
      message: "The token has already expired.",
    };
  }
};

export const getAuthState = cache(async (): Promise<AuthInfo> => {
  const cookieStore = await cookies();
  const access_token = cookieStore.get("access_token")?.value;
  const refresh_token = cookieStore.get("refresh_token")?.value;
  const name = cookieStore.get("name")?.value;
  const nickName = cookieStore.get("nickName")?.value;
  const email = cookieStore.get("email")?.value;

  // access_token 유효성 검사
  if (access_token) {
    const isValid = await validateToken(access_token);
    if (isValid) {
      return {
        isAuthenticated: true,
        message: "Success validation!",
        name,
        nickName,
        email,
      };
    }
  }

  // refresh_token이 없는 경우
  if (!refresh_token) {
    await clearAuth();
    return {
      isAuthenticated: false,
      message: "The token does not exist.",
      name: undefined,
      nickName: undefined,
      email: undefined,
    };
  }

  // access_token이 만료되었고 refresh_token이 존재하면 refresh_token으로 재발급 시도
  const refreshTokenResult = await refreshToken(refresh_token, cookieStore);

  if (!refreshTokenResult?.isAuthenticated) {
    await clearAuth();
  }

  return {
    ...refreshTokenResult,
    name: refreshTokenResult.isAuthenticated ? name : undefined,
    nickName: refreshTokenResult.isAuthenticated ? nickName : undefined,
    email: refreshTokenResult.isAuthenticated ? email : undefined,
  };
});

// 인증 상태 초기화 함수
export const clearAuth = async () => {
  const cookieStore = await cookies();
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
  cookieStore.delete("name");
  cookieStore.delete("nickName");
  cookieStore.delete("email");
};
