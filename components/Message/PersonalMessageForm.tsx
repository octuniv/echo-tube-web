// components/message/PersonalMessageForm.tsx
"use client";
import { useActionState, useEffect } from "react";
import { CreateMessageFormState } from "@/lib/definition/messageSchema";
import { SendMessage } from "@/lib/action/messageActions";
import { useRouter } from "next/navigation";
import { MessageResponses } from "@/lib/constants/message/constants";

export default function PersonalMessageForm() {
  const router = useRouter();

  const initialState: CreateMessageFormState = {
    errors: {},
    message: "",
  };

  const [state, formAction, isPending] = useActionState(
    SendMessage,
    initialState
  );

  useEffect(() => {
    if (state.message === MessageResponses.SENT) {
      const timer = setTimeout(() => {
        router.push("/messages");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state.message, router]);

  return (
    <form action={formAction} className="space-y-6">
      {/* 전역 메시지 */}
      {state.message && (
        <div
          className={`p-4 rounded-md ${
            state.message.includes("성공") ||
            state.message === MessageResponses.SENT
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {state.message}
        </div>
      )}

      {/* 내용 필드 */}
      <div>
        <label
          htmlFor="content"
          className="block text-sm font-medium text-gray-700"
        >
          내용 *
        </label>
        <textarea
          id="content"
          name="content"
          rows={6}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="메시지 내용을 입력하세요..."
          disabled={isPending}
        />
        {state.errors?.content && (
          <p className="mt-1 text-sm text-red-600">{state.errors.content[0]}</p>
        )}
      </div>

      {/* 수신자 닉네임 필드 (필수) */}
      <div>
        <label
          htmlFor="receiverNickname"
          className="block text-sm font-medium text-gray-700"
        >
          수신자 닉네임 *
        </label>
        <input
          type="text"
          id="receiverNickname"
          name="receiverNickname"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="닉네임을 입력하세요"
          required
          disabled={isPending}
        />
        {state.errors?.receiverNickname && (
          <p className="mt-1 text-sm text-red-600">
            {state.errors.receiverNickname[0]}
          </p>
        )}
      </div>

      {/* 숨김 필드: 공지 여부 false (강제) */}
      <input type="hidden" name="isNotice" value="false" />

      {/* 제출 버튼 */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "전송 중..." : "전송하기"}
      </button>
    </form>
  );
}
