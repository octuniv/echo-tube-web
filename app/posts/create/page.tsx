import CreatePostPage from "@/components/posts/create/CreatePostPage";
import { loginStatus } from "@/lib/authState";
import { redirect } from "next/navigation";

const page: React.FC = async () => {
  // 로그인 상태 확인
  const isLogined = await loginStatus();

  // 로그인이 되지 않은 경우 /login로 리다이렉트
  if (!isLogined) {
    redirect("/login");
  }

  return <CreatePostPage />;
};

export default page;
