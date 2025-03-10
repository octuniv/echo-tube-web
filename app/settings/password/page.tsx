import { ChangePasswordPage } from "@/components/settings/password/ChangePasswordPage";
import { loginStatus } from "@/lib/authState";
import { redirect } from "next/navigation";

const page: React.FC = async () => {
  // 로그인 상태 확인
  const isLogined = await loginStatus();

  // 로그인이 되지 않은 경우
  if (!isLogined) {
    redirect("/");
  }

  return <ChangePasswordPage />;
};

export default page;
