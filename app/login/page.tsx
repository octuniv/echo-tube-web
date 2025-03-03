import LoginPage from "@/components/login/LoginPage";
import { loginStatus } from "@/lib/authState";
import { redirect } from "next/navigation";

const page: React.FC = async () => {
  // 로그인 상태 확인
  const isLogined = await loginStatus();

  // 로그인이 된된 경우 홈으로 리다이렉트
  if (isLogined) {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <LoginPage />
    </div>
  );
};

export default page;
