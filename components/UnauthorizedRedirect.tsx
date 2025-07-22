// UnauthorizedRedirect.tsx (클라이언트 컴포넌트)
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UnauthorizedRedirect() {
  const router = useRouter();

  useEffect(() => {
    // 로그아웃 API 호출
    fetch("/api/auth/logout", { method: "POST" })
      .then(() => {
        // 로그인 페이지로 리디렉션
        router.push("/login?error=session_expired");
      })
      .catch((err) => {
        console.error("로그아웃 실패:", err);
        router.push("/login?error=session_expired");
      });
  }, [router]);

  return <div>로그아웃 중입니다...</div>;
}
