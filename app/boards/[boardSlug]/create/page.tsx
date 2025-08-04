import PostCreatePage from "@/components/Boards/create/PostCreatePage";
import { loginStatus } from "@/lib/authState";
import { redirect } from "next/navigation";

const page: React.FC<{
  params: Promise<{ boardSlug: string }>;
}> = async ({ params }: { params: Promise<{ boardSlug: string }> }) => {
  const { boardSlug } = await params;
  // 로그인 상태 확인
  const isLogined = await loginStatus();

  // 로그인이 되지 않은 경우 /login로 리다이렉트
  if (!isLogined) {
    redirect("/login");
  }

  return <PostCreatePage boardSlug={boardSlug} />;
};

export default page;
