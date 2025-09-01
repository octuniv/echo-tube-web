import { PostResponse } from "@/lib/definition/postSchema";
import PostLayout from "./Shared/PostLayout";
import CommentSection from "../Comment/CommentSection";
import { PaginatedCommentListItemDto } from "@/lib/definition/commentSchema";
import { UserAuthInfo } from "@/lib/definition/userAuthSchemas";

interface ComponentProps {
  post: PostResponse;
  isEditable: boolean;
  boardSlug: string;
  comments: PaginatedCommentListItemDto;
  userStatusInfo: UserAuthInfo;
}

export default function PostComponent({
  post,
  isEditable,
  boardSlug,
  comments,
  userStatusInfo,
}: ComponentProps) {
  return (
    <PostLayout
      post={post}
      isEditable={isEditable}
      boardSlug={boardSlug}
      isLoggedIn={!!userStatusInfo.role}
    >
      <div className="mt-6 text-sm text-gray-700 space-y-2">
        {post.channelTitle && (
          <p className="flex items-center gap-2">
            <span className="font-semibold">채널:</span>
            {post.channelTitle}
          </p>
        )}
        {post.duration && (
          <p className="flex items-center gap-2">
            <span className="font-semibold">길이:</span>
            {post.duration}
          </p>
        )}
        {post.source && (
          <p className="flex items-center gap-2">
            <span className="font-semibold">출처:</span>
            <a
              href={post.source}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              {post.source}
            </a>
          </p>
        )}
      </div>

      <CommentSection
        postId={post.id}
        boardSlug={boardSlug}
        comments={comments}
        userStatusInfo={userStatusInfo}
      />
    </PostLayout>
  );
}
