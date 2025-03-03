import { NextRequest, NextResponse } from "next/server";

// 보호된 페이지 목록
const protectedRoutes = ["/dashboard"];

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some((route) =>
    path.startsWith(route)
  );

  // ✅ `req.cookies.get()`로 접근 (정상적으로 저장되었을 경우)
  const accessToken = req.cookies.get("access_token")?.value;

  // 보호된 페이지 접근 시 로그인 필요
  if (isProtectedRoute && !accessToken) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  return NextResponse.next();
}

// API 요청, 정적 파일 등은 제외
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
