"use server";
import CommentList from "./CommentList";
import CommentForm from "./CommentForm";
import { PaginatedCommentListItemDto } from "@/lib/definition/commentSchema";
import { UserAuthInfo } from "@/lib/definition/userAuthSchemas";

interface CommentSectionProps {
  postId: number;
  boardSlug: string;
  comments: PaginatedCommentListItemDto;
  userStatusInfo: UserAuthInfo;
}

export default async function CommentSection({
  postId,
  boardSlug,
  comments,
  userStatusInfo,
}: CommentSectionProps) {
  return (
    <div className="container mx-auto px-4 py-8 mt-8 border-t border-gray-200">
      {/* 댓글 작성 폼 */}
      <div className="mb-8">
        <CommentForm postId={postId} userStatusInfo={userStatusInfo} />
      </div>

      {/* 댓글 목록 */}
      <CommentList
        postId={postId}
        boardSlug={boardSlug}
        comments={comments}
        userStatusInfo={userStatusInfo}
      />
    </div>
  );
}
