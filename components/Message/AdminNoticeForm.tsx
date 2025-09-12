// components/message/AdminNoticeForm.tsx
"use client";
import { useActionState, useEffect } from "react";
import { CreateMessageFormState } from "@/lib/definition/messageSchema";
import { SendMessage } from "@/lib/action/messageActions";
import { useRouter } from "next/navigation";
import { MessageResponses } from "@/lib/constants/message/constants";

export default function AdminNoticeForm() {
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
        router.push("/admin/notices");
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
          공지 내용 *
        </label>
        <textarea
          id="content"
          name="content"
          rows={6}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="모든 사용자에게 전달될 공지 내용을 입력하세요..."
          disabled={isPending}
        />
        {state.errors?.content && (
          <p className="mt-1 text-sm text-red-600">{state.errors.content[0]}</p>
        )}
      </div>

      {/* 수신자 필드: 숨김 + 강제 비활성화 */}
      <input type="hidden" name="receiverNickname" value="" />
      <input type="hidden" name="isNotice" value="true" />

      {/* 공지 전송 안내 메시지 */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-sm text-yellow-800">
          ⚠️ 이 메시지는 <strong>모든 사용자에게 공지</strong>로 전송됩니다.
        </p>
      </div>

      {/* 제출 버튼 */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "전송 중..." : "공지 전송하기"}
      </button>
    </form>
  );
}
