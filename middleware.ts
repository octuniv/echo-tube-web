import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const userCookie = req.cookies.get("user");
  const refresh_token = req.cookies.get("refresh_token")?.value;

  // user 쿠키가 없을 경우 모든 쿠키 삭제
  if (!userCookie) {
    const response = NextResponse.redirect(
      new URL("/login?error=session_expired", req.url)
    );

    if (refresh_token) {
      try {
        const response = await fetch(
          `${process.env.SERVER_ADDRESS}/auth/logout`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token }),
            signal: AbortSignal.timeout(5000),
          }
        );
        if (!response.ok) {
          console.warn("Token revocation failed");
        }
      } catch (error) {
        console.error("Logout error:", error);
      }
    }

    // 모든 쿠키 삭제
    response.cookies.set("access_token", "", { maxAge: 0 });
    response.cookies.set("refresh_token", "", { maxAge: 0 });
    response.cookies.set("user", "", { maxAge: 0 });

    return response;
  }

  // 기존 어드민 권한 검증 로직
  let isAdmin = false;
  try {
    const userData = JSON.parse(userCookie.value);
    isAdmin = userData?.role?.toLowerCase() === "admin";
  } catch (error) {
    console.error("쿠키 파싱 실패:", error);
  }

  if (!isAdmin) {
    return NextResponse.redirect(new URL("/forbidden", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
