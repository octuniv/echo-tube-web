import LoginPage from "@/components/login/LoginPage";
import { getAuthState } from "@/lib/authState";
import { redirect } from "next/navigation";

const page: React.FC = async () => {
  // 인증 상태 확인
  const authState = await getAuthState();

  // 인증된 경우 /dashboard로 리다이렉트
  if (authState.isAuthenticated) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <LoginPage />
    </div>
  );
};

export default page;
