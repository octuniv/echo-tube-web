import { PostResponse } from "@/lib/definition";
import PostLayout from "../Shared/PostLayout";

interface GeneralPostPageProps {
  post: PostResponse; // URL에서 전달되는 게시물 ID
  isEditable: boolean;
  boardSlug: string;
}

export default function GeneralPostPage({
  post,
  isEditable,
  boardSlug,
}: GeneralPostPageProps) {
  return (
    <PostLayout post={post} isEditable={isEditable} boardSlug={boardSlug}>
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
    </PostLayout>
  );
}
