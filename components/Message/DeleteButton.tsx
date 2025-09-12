// components/message/DeleteButton.tsx
"use client";

import { DeleteMessage } from "@/lib/action/messageActions";
import { useState } from "react";
import { MessageResponses } from "@/lib/constants/message/constants";
import { useRouter } from "next/navigation";

interface DeleteButtonProps {
  messageId: number;
  senderNickname: string;
  currentUserNickname: string;
}

export default function DeleteButton({
  messageId,
  senderNickname,
  currentUserNickname,
}: DeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const router = useRouter();

  const handleDelete = async () => {
    if (senderNickname !== currentUserNickname) {
      setMessage("삭제 권한이 없습니다.");
      return;
    }

    setIsDeleting(true);
    setMessage(null);

    const result = await DeleteMessage(messageId);
    setMessage(result.message);

    if (result.message === MessageResponses.DELETED) {
      setTimeout(() => {
        router.push("/messages");
      }, 1500);
    }

    setIsDeleting(false);
    setShowConfirm(false);
  };

  if (senderNickname !== currentUserNickname) {
    return null;
  }

  return (
    <>
      {/* 삭제 버튼 */}
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          disabled={isDeleting}
          className={`px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition`}
        >
          {isDeleting ? "삭제 중..." : "메시지 삭제"}
        </button>
      </div>

      {/* ✅ 삭제 확인 모달 (Overlay + Dialog) */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              정말로 이 메시지를 삭제하시겠습니까?
            </h3>
            <p className="text-gray-700 mb-6">
              이 작업은 되돌릴 수 없습니다. 삭제된 메시지는 복구할 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                disabled={isDeleting}
              >
                {isDeleting ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ 결과 메시지 표시 (성공/실패) */}
      {message && (
        <p
          className={`mt-4 text-sm ${
            message.includes("성공") ? "text-green-600" : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}
    </>
  );
}
