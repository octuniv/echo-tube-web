import { notFound, redirect } from "next/navigation";
import { FetchPost } from "@/lib/actions";
import { userStatus } from "@/lib/authState";
import EditPostPage from "@/components/posts/edit/EditPostPage";

interface PostPageProps {
  params: Promise<{
    id: string; // URL에서 전달되는 게시물 ID
  }>;
}

export default async function Page({ params }: PostPageProps) {
  const { id } = await params;
  const postId = Number(id); // 문자열 ID를 숫자로 변환

  if (isNaN(postId)) {
    notFound(); // 유효하지 않은 ID인 경우 404 처리
  }

  const post = await FetchPost(postId);
  const { nickName } = await userStatus();
  const isEditable = nickName === post.nickName;

  if (!isEditable) {
    redirect("/posts");
  }

  return <EditPostPage postId={postId} post={post} />;
}
