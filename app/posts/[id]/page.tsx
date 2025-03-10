import { notFound } from "next/navigation";
import { FetchPost } from "@/lib/actions";
import PostPage from "@/components/posts/PostPage";
import { userStatus } from "@/lib/authState";

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
  const { nickname } = await userStatus();
  const isEditable = nickname === post.nickname;

  return <PostPage post={post} isEditable={isEditable} />;
}
