import { serverAddress } from "@/lib/util";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const reqAddress = serverAddress + "/auth/login";

    const { email, password } = await request.json();

    if (!email || !password) {
      return new NextResponse(
        JSON.stringify({ message: "Email and password are required" }),
        { status: 400 }
      );
    }

    // 🛠 실제 백엔드 서버로 로그인 요청
    const serverResponse = await fetch(reqAddress, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!serverResponse.ok) {
      return new NextResponse(
        JSON.stringify({ message: "Invalid credentials" }),
        { status: 401 }
      );
    }

    const { access_token, refresh_token } = await serverResponse.json();

    return new NextResponse(
      JSON.stringify({
        success: true,
        access_token: access_token,
        refresh_token: refresh_token,
      }),
      { status: 200 }
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ message: "Invalid credentials" }),
      { status: 401 }
    );
  }
}
