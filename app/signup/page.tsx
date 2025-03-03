import SignUpPage from "@/components/signup/SignUpPage";
import { loginStatus } from "@/lib/authState";
import { redirect } from "next/navigation";

const page: React.FC = async () => {
  // 로그인 상태 확인
  const isLogined = await loginStatus();

  // 로그인 된 경우 홈으로 리다이렉트
  if (isLogined) {
    redirect("/dashboard");
  }

  return <SignUpPage />;
};

export default page;
