import CreatePostPage from "@/components/posts/create/CreatePostPage";
import { getAuthState } from "@/lib/authState";
import { redirect } from "next/navigation";

const page: React.FC = async () => {
  // 인증 상태 확인
  const authState = await getAuthState();

  // 인증되지 않은 경우우 /login로 리다이렉트
  if (!authState.isAuthenticated) {
    redirect("/login");
  }

  return <CreatePostPage />;
};

export default page;
