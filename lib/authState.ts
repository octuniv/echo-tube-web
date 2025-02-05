// lib/authState.js

import { cache } from "react";
import { cookies } from "next/headers";
import { serverAddress } from "./util";

type AuthSuccess = { isAuthenticated: true };
type AuthFailure = { isAuthenticated: false; message: string };
type AuthResult = AuthSuccess | AuthFailure;

let cachedAuthState: AuthResult | null = null;

export const getAuthState = cache(async (): Promise<AuthResult> => {
  if (cachedAuthState) {
    return cachedAuthState;
  }

  const cookieStore = await cookies();
  const access_token = cookieStore.get("access_token")?.value;
  const refresh_token = cookieStore.get("refresh_token")?.value;

  if (!(access_token && refresh_token)) {
    cachedAuthState = {
      isAuthenticated: false,
      message: "The token does not exist.",
    };
    return cachedAuthState;
  }

  const validateTokenApiAddress = serverAddress + "/auth/validate-token";

  try {
    const response = await fetch(validateTokenApiAddress, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to validate token");
    }

    const { valid } = await response.json();

    if (valid) {
      cachedAuthState = { isAuthenticated: true };
      return cachedAuthState;
    }
  } catch (err) {
    console.error(err);
    cachedAuthState = {
      isAuthenticated: false,
      message: "There is a problem with sending the api",
    };
    return cachedAuthState;
  }

  // 토큰이 유효하지 않은 경우 리프레시 토큰으로 새로운 액세스 토큰 발급
  const refreshTokenApiAddress = serverAddress + "/auth/refresh";

  try {
    const response = await fetch(refreshTokenApiAddress, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh_token: refresh_token,
      }),
    });

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

    cachedAuthState = { isAuthenticated: true };
    return cachedAuthState;
  } catch (err) {
    console.error(err);
    cachedAuthState = {
      isAuthenticated: false,
      message: "The token has already expired.",
    };
    return cachedAuthState;
  }
});

// 인증 상태 초기화 함수 (로그아웃 시 사용)
export const resetAuthState = () => {
  cachedAuthState = null;
};
