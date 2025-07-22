// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const refresh_token = request.cookies.get("refresh_token")?.value;
  const BASE_API_URL = process.env.BASE_API_URL;

  if (refresh_token && BASE_API_URL) {
    try {
      const res = await fetch(`${BASE_API_URL}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token }),
      });
      if (!res.ok) {
        console.warn("리프레시 토큰 폐기 실패");
      }
    } catch (error) {
      console.error("리프레시 토큰 폐기 오류:", error);
    }
  }

  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.set("access_token", "", { maxAge: 0, path: "/" });
  response.cookies.set("refresh_token", "", { maxAge: 0, path: "/" });
  response.cookies.set("user", "", { maxAge: 0, path: "/" });

  return response;
}
