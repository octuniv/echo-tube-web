import { notFound, redirect } from "next/navigation";
import { FetchPost } from "@/lib/action/postActions";
import { userStatus } from "@/lib/authState";
import PostEditPage from "@/components/Boards/General/edit/PostEditPage";
import { canModifyPost } from "@/lib/util";

interface PostPageProps {
  params: Promise<{
    boardSlug: string;
    id: string; // URL에서 전달되는 게시물 ID
  }>;
}

export default async function Page({ params }: PostPageProps) {
  const { boardSlug, id } = await params;
  const postId = Number(id); // 문자열 ID를 숫자로 변환

  if (isNaN(postId)) {
    notFound(); // 유효하지 않은 ID인 경우 404 처리
  }

  const post = await FetchPost(postId);
  const userStatusInfo = await userStatus();
  const isEditable = canModifyPost({ user: userStatusInfo, post });

  if (!isEditable) {
    redirect(`/boards/${boardSlug}`);
  }

  return <PostEditPage postId={postId} boardSlug={boardSlug} post={post} />;
}
