import SignUpPage from "@/components/signup/SignUpPage";
import { getAuthState } from "@/lib/authState";
import { redirect } from "next/navigation";

const page: React.FC = async () => {
  // 인증 상태 확인
  const authState = await getAuthState();

  // 인증된 경우 /dashboard로 리다이렉트
  if (authState.isAuthenticated) {
    redirect("/dashboard");
  }
  return <SignUpPage />;
};

export default page;
