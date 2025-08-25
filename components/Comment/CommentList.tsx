"use client";
import { useMemo } from "react";
import {
  CommentListItemDto,
  PaginatedCommentListItemDto,
} from "@/lib/definition/commentSchema";
import { DeleteComment, LikeComment } from "@/lib/action/commentActions";
import { useRouter } from "next/navigation";
import CommentItem from "./CommentItem";
import { UserAuthInfo } from "@/lib/definition/userAuthSchemas";
import { COMMENT_MESSAGES } from "@/lib/constants/comment/errorMessage";
import { PaginationControls } from "../Pagination/PaginationControls";

interface CommentListProps {
  postId: number;
  boardSlug: string;
  comments: PaginatedCommentListItemDto;
  userStatusInfo: UserAuthInfo;
}

export default function CommentList({
  postId,
  boardSlug,
  comments,
  userStatusInfo,
}: CommentListProps) {
  const router = useRouter();

  const { parents, children } = useMemo(() => {
    const parents: CommentListItemDto[] = [];
    const children: { [parentId: number]: CommentListItemDto[] } = {};

    comments.data.forEach((comment) => {
      if (comment.parentId === null || comment.parentId === undefined) {
        parents.push(comment);
      } else {
        if (!children[comment.parentId]) {
          children[comment.parentId] = [];
        }
        children[comment.parentId].push(comment);
      }
    });

    return { parents, children };
  }, [comments]);

  const handleDelete = async (commentId: number) => {
    const result = await DeleteComment(postId, commentId);

    if (result.message === COMMENT_MESSAGES.DELETED) {
      router.refresh();
    } else {
      console.error("댓글 삭제 실패:", result.message);
      alert(result.message || "댓글 삭제에 실패했습니다.");
    }
  };

  const handleLike = async (commentId: number) => {
    const result = await LikeComment(postId, commentId);

    if (result && "isAdded" in result && result.isAdded) {
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      {parents.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          아직 작성된 댓글이 없습니다.
        </div>
      ) : (
        <>
          {parents.map((parent) => (
            <CommentItem
              key={parent.id}
              comment={parent}
              replies={children[parent.id] || []}
              onDelete={handleDelete}
              onLike={handleLike}
              userStatusInfo={userStatusInfo}
              postId={postId}
            />
          ))}

          {comments.totalPages > 1 && (
            <PaginationControls
              currentPage={comments.currentPage}
              totalPages={comments.totalPages}
              baseUrl={`/boards/${boardSlug}/${postId}`}
            />
          )}
        </>
      )}
    </div>
  );
}
