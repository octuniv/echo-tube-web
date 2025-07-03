import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const userCookie = req.cookies.get("user");

  let isAdmin = false;

  if (userCookie) {
    try {
      const userData = JSON.parse(userCookie.value);
      if (
        userData &&
        userData.role &&
        userData.role.toLowerCase() === "admin"
      ) {
        isAdmin = true;
      }
    } catch (error) {
      console.error("쿠키 파싱 실패:", error);
    }
  }

  if (req.nextUrl.pathname.startsWith("/admin")) {
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
