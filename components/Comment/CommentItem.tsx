"use client";
import { useCallback, useState } from "react";
import { CommentListItemDto } from "@/lib/definition/commentSchema";
import { UserAuthInfo } from "@/lib/definition/userAuthSchemas";
import CommentEditForm from "./CommentEditForm";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import CommentForm from "./CommentForm";
import { UserRole } from "@/lib/definition/enums";

interface CommentItemProps {
  comment: CommentListItemDto;
  replies: CommentListItemDto[];
  onDelete: (commentId: number) => void;
  onLike: (commentId: number) => void;
  userStatusInfo: UserAuthInfo;
  postId: number;
}

export default function CommentItem({
  comment,
  replies,
  onDelete,
  onLike,
  userStatusInfo,
  postId,
}: CommentItemProps) {
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [showReplies, setShowReplies] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const isCurrentUser = userStatusInfo.nickname === comment.nickname;
  const isAdmin = userStatusInfo.role === UserRole.ADMIN;

  const handleDelete = () => {
    if (window.confirm("정말로 이 댓글을 삭제하시겠습니까?")) {
      onDelete(comment.id);
    }
  };

  const toggleReplies = () => {
    setShowReplies(!showReplies);
  };

  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: ko,
    });
  };

  const handleEditCancel = useCallback(() => {
    setEditingCommentId(null);
  }, []);

  const isEditingParent = editingCommentId === comment.id;

  const isEditingReply =
    editingCommentId !== null && replies.some((r) => r.id === editingCommentId);

  const getEditingReply = () => {
    return replies.find((r) => r.id === editingCommentId);
  };

  const handleReplyCancel = useCallback(() => {
    setIsReplying(false);
  }, []);

  if (isEditingParent) {
    return (
      <CommentEditForm
        comment={comment}
        postId={postId}
        userStatusInfo={userStatusInfo}
        onCancel={handleEditCancel}
      />
    );
  }

  if (isEditingReply) {
    const editingReply = getEditingReply();
    if (editingReply) {
      return (
        <CommentEditForm
          comment={editingReply}
          postId={postId}
          userStatusInfo={userStatusInfo}
          onCancel={handleEditCancel}
        />
      );
    }
  }

  return (
    <div
      aria-label="parent-comment-container"
      className="bg-white rounded-lg p-4 border border-gray-200 mb-4"
    >
      <div className="flex items-start space-x-3">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span
                aria-label="parent-comment-author"
                className="font-medium text-gray-800"
              >
                {comment.nickname}
              </span>
              <span className="text-xs text-gray-500">
                {formatTime(comment.createdAt)}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                aria-label="parent-comment-like-button"
                onClick={() => onLike(comment.id)}
                className={`flex items-center space-x-1 ${
                  comment.likes > 0 ? "text-blue-500" : "text-gray-500"
                } hover:text-blue-600`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{comment.likes}</span>
              </button>
              {(isCurrentUser || isAdmin) && (
                <div className="flex space-x-2">
                  {isCurrentUser && (
                    <button
                      aria-label="parent-comment-edit-button"
                      onClick={() => setEditingCommentId(comment.id)}
                      className="text-sm text-blue-500 hover:text-blue-700"
                    >
                      수정
                    </button>
                  )}
                  <button
                    aria-label="parent-comment-delete-button"
                    onClick={handleDelete}
                    className="text-sm text-red-500 hover:text-red-700"
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>
          </div>
          <p
            aria-label="parent-comment-content"
            className="mt-2 text-gray-700 whitespace-pre-wrap"
          >
            {comment.content}
          </p>

          {/* 답글 관련 버튼 그룹 - 시각적 구분 강화 */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {/* 답글 달기 버튼 - 아이콘 추가 및 스타일 개선 */}
              {!isReplying && (
                <button
                  onClick={() => setIsReplying(true)}
                  className="flex items-center text-blue-500 hover:text-blue-600 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  답글 달기
                </button>
              )}

              {/* 대댓글이 있는 경우 표시 - 아이콘 추가 및 스타일 개선 */}
              {comment.hasReplies && (
                <button
                  onClick={toggleReplies}
                  className="flex items-center text-blue-500 hover:text-blue-600 transition-colors"
                >
                  {showReplies ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 15l7-7 7 7"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  )}
                  {showReplies
                    ? "답글 숨기기"
                    : `답글 보기 (${replies.length})`}
                </button>
              )}
            </div>
          </div>

          {/* 대댓글 폼 표시 영역 - 스타일 강화 */}
          {isReplying && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <CommentForm
                postId={postId}
                userStatusInfo={userStatusInfo}
                parentId={comment.id}
                onCancel={handleReplyCancel}
              />
            </div>
          )}

          {/* 대댓글 표시 영역 - 계층 구조 강화 */}
          {showReplies && replies.length > 0 && (
            <div className="mt-5">
              {replies.map((reply) => (
                <div
                  key={reply.id}
                  aria-label="reply-comment-container"
                  className="pt-3 pb-4 pl-4 pr-2 mt-3 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span
                        aria-label="reply-comment-author"
                        className="font-medium text-gray-800"
                      >
                        {reply.nickname}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(reply.createdAt)}
                      </span>
                    </div>
                    {(userStatusInfo.nickname === reply.nickname ||
                      userStatusInfo.role === UserRole.ADMIN) && (
                      <div className="flex items-center space-x-3">
                        <button
                          aria-label="reply-comment-like-button"
                          onClick={() => onLike(reply.id)}
                          className={`flex items-center space-x-1 ${
                            reply.likes > 0 ? "text-blue-500" : "text-gray-500"
                          } hover:text-blue-600`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>{reply.likes}</span>
                        </button>
                        {userStatusInfo.nickname === reply.nickname && (
                          <button
                            aria-label="reply-comment-edit-button"
                            onClick={() => setEditingCommentId(reply.id)}
                            className="text-sm text-blue-500 hover:text-blue-700"
                          >
                            수정
                          </button>
                        )}
                        <button
                          aria-label="reply-comment-delete-button"
                          onClick={() => onDelete(reply.id)}
                          className="text-sm text-red-500 hover:text-red-700"
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                  <p
                    aria-label="reply-comment-content"
                    className="mt-2 text-gray-700 whitespace-pre-wrap"
                  >
                    {reply.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
