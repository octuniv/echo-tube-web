"use client";

import { useState, useEffect } from "react";
import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CommentFormState } from "@/lib/definition/commentSchema";
import { CreateComment } from "@/lib/action/commentActions";
import Link from "next/link";
import { COMMENT_MESSAGES } from "@/lib/constants/comment/errorMessage";
import { UserAuthInfo } from "@/lib/definition/userAuthSchemas";

interface CommentFormProps {
  postId: number;
  userStatusInfo: UserAuthInfo;
  parentId?: number;
  onCancel?: () => void;
}

export default function CommentForm({
  postId,
  userStatusInfo,
  parentId,
  onCancel,
}: CommentFormProps) {
  const initialState: CommentFormState = { errors: {}, message: "" };
  const CreateCommentWithPostId = CreateComment.bind(null, postId, parentId);
  const [state, formAction, isPending] = useActionState(
    CreateCommentWithPostId,
    initialState
  );

  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const [content, setContent] = useState("");

  useEffect(() => {
    if (state.message && state.message.includes(COMMENT_MESSAGES.CREATED)) {
      startTransition(() => {
        router.refresh();
      });
    }
  }, [state, router]);

  if (!userStatusInfo.nickname) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <p className="text-gray-700">
          댓글을 작성하려면{" "}
          <Link href={`/login`} className="text-blue-500 hover:underline">
            로그인
          </Link>
          해주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      {onCancel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-blue-500">답글 작성 중...</span>
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            취소
          </button>
        </div>
      )}
      <form action={formAction}>
        <div className="mb-4">
          <textarea
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="댓글을 작성해주세요..."
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
          <button
            type="submit"
            disabled={isPending || isRefreshing || !content.trim()}
            className={`px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors ${
              isPending || isRefreshing || !content.trim()
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            {isPending || isRefreshing ? "등록 중..." : "댓글 등록"}
          </button>
        </div>

        {state.message && state.message !== COMMENT_MESSAGES.CREATED && (
          <div className={`mt-2 text-sm text-red-500`}>{state.message}</div>
        )}
      </form>
    </div>
  );
}
