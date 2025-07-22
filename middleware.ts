import { NextRequest, NextResponse } from "next/server";

const BASE_API_URL = process.env.BASE_API_URL;

const baseCookieOptions = {
  httpOnly: true,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  domain:
    process.env.NODE_ENV === "production"
      ? process.env.NEXT_PUBLIC_SERVER_ADDRESS
      : "localhost",
};

async function logout(req: NextRequest) {
  const refresh_token = req.cookies.get("refresh_token")?.value;
  const response = NextResponse.redirect(
    new URL("/login?error=session_expired", req.url)
  );

  if (refresh_token) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(`${BASE_API_URL}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token }),
        signal: controller.signal,
      });
      if (!response.ok) {
        console.warn("Token revocation failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearTimeout(timeout);
    }
  }

  // 모든 쿠키 삭제
  response.cookies.set("access_token", "", { maxAge: 0 });
  response.cookies.set("refresh_token", "", { maxAge: 0 });
  response.cookies.set("user", "", { maxAge: 0 });

  return response;
}

async function refresh(req: NextRequest) {
  const refresh_token = req.cookies.get("refresh_token")?.value;

  if (refresh_token) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(`${BASE_API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token }),
        signal: controller.signal,
      });

      if (res.ok) {
        const { access_token: newAccessToken, refresh_token: newRefreshToken } =
          await res.json();
        const response = NextResponse.next();
        response.cookies.set("access_token", newAccessToken, {
          ...baseCookieOptions,
          maxAge: 60 * 15,
        });
        response.cookies.set("refresh_token", newRefreshToken, {
          ...baseCookieOptions,
          maxAge: 60 * 60 * 24 * 7,
        });
        return response;
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
    } finally {
      clearTimeout(timeout);
    }
  }

  return await logout(req);
}

export async function middleware(req: NextRequest) {
  const access_token = req.cookies.get("access_token")?.value;
  const userCookie = req.cookies.get("user");

  // user 쿠키가 없을 경우 모든 쿠키 삭제
  if (!userCookie) {
    return await logout(req);
  }

  // 기존 어드민 권한 검증 로직
  let isAdmin = false;
  try {
    const userData = JSON.parse(userCookie.value);
    isAdmin = userData?.role?.toLowerCase() === "admin";
  } catch (error) {
    console.error("쿠키 파싱 실패:", error);
    return await logout(req);
  }

  if (!isAdmin) {
    return NextResponse.redirect(new URL("/forbidden", req.url));
  }

  if (!access_token) {
    return await refresh(req);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
