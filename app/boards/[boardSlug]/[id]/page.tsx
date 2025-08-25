import { notFound } from "next/navigation";
import { FetchPost } from "@/lib/action/postActions";
import { userStatus } from "@/lib/authState";
import { canModifyPost } from "@/lib/util";
import PostComponent from "@/components/Boards/PostComponent";
import { FetchComments } from "@/lib/action/commentActions";

interface PostPageProps {
  params: Promise<{
    boardSlug: string;
    id: string;
  }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function Page({ params, searchParams }: PostPageProps) {
  const { boardSlug, id } = await params;
  const postId = Number(id);
  if (isNaN(postId)) {
    notFound();
  }

  let commentPage = 1;
  const { page } = await searchParams;
  if (page) {
    const pageParam = Array.isArray(page) ? page[0] : page;
    const pageNum = Number(pageParam);
    if (!isNaN(pageNum) && pageNum > 0) {
      commentPage = pageNum;
    }
  }

  const [post, comments, userStatusInfo] = await Promise.all([
    FetchPost(postId),
    FetchComments(postId, commentPage),
    userStatus(),
  ]);

  if (post.board.slug !== boardSlug) {
    notFound();
  }

  const isEditable = canModifyPost({ user: userStatusInfo, post });

  return (
    <PostComponent
      post={post}
      isEditable={isEditable}
      boardSlug={boardSlug}
      comments={comments}
      userStatusInfo={userStatusInfo}
    />
  );
}
