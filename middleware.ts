import { NextRequest, NextResponse } from "next/server";

// 보호된 페이지 목록
const protectedRoutes = ["/dashboard"];
const publicRoutes = ["/login", "/signup", "/"];

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.includes(path);
  const isPublicRoute = publicRoutes.includes(path);

  // ✅ `req.cookies.get()`로 접근 (정상적으로 저장되었을 경우)
  const accessToken = req.cookies.get("access_token")?.value;

  // 보호된 페이지 접근 시 로그인 필요
  if (isProtectedRoute && !accessToken) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // 로그인/회원가입 페이지 접근 시 이미 로그인한 경우 대시보드로 이동
  if (
    isPublicRoute &&
    accessToken &&
    !req.nextUrl.pathname.startsWith("/dashboard")
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
}

// API 요청, 정적 파일 등은 제외
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
