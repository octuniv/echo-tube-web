"use client";

import { useState, useEffect, useTransition } from "react";
import { useActionState } from "react";
import {
  CommentFormState,
  CommentListItemDto,
} from "@/lib/definition/commentSchema";
import { EditComment } from "@/lib/action/commentActions";
import { useRouter } from "next/navigation";
import { COMMENT_MESSAGES } from "@/lib/constants/comment/errorMessage";
import { UserAuthInfo } from "@/lib/definition/userAuthSchemas";

interface CommentEditFormProps {
  comment: CommentListItemDto;
  postId: number;
  userStatusInfo: UserAuthInfo;
  onCancel: () => void;
}

export default function CommentEditForm({
  comment,
  postId,
  userStatusInfo,
  onCancel,
}: CommentEditFormProps) {
  const isCurrentUser = userStatusInfo.nickname === comment.nickname;
  const initialState: CommentFormState = { errors: {}, message: "" };
  const EditCommentWithIds = EditComment.bind(null, postId, comment.id);
  const [state, formAction, isPending] = useActionState(
    EditCommentWithIds,
    initialState
  );
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const [content, setContent] = useState(comment.content);

  useEffect(() => {
    if (state.message && state.message.includes(COMMENT_MESSAGES.UPDATED)) {
      startTransition(() => {
        router.refresh();
      });
    }
  }, [state, router]);

  if (!isCurrentUser) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">본인의 댓글만 수정할 수 있습니다.</p>
        <button
          onClick={onCancel}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg"
        >
          돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
      <form action={formAction}>
        <div className="mb-4">
          <textarea
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="댓글을 수정해주세요..."
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            disabled={isPending || isRefreshing}
          />
          {state.errors?.content && (
            <p className="mt-1 text-red-500 text-sm">{state.errors.content}</p>
          )}
        </div>

        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">{content.length}/500</p>
          <div className="space-x-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isPending || isRefreshing}
              className="px-3 py-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isPending || isRefreshing || !content.trim()}
              className={`px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors ${
                isPending || isRefreshing || !content.trim()
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              {isPending || isRefreshing ? "수정 중..." : "수정 완료"}
            </button>
          </div>
        </div>

        {state.message && (
          <div className={`mt-2 text-sm "text-red-500"`}>{state.message}</div>
        )}
      </form>
    </div>
  );
}
