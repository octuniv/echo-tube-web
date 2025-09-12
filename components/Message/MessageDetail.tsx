// components/message/MessageDetail.tsx
"use client";
import { MessageDetailDto } from "@/lib/definition/messageSchema";
import DeleteButton from "./DeleteButton";
import { useRouter } from "next/navigation";

interface MessageDetailProps {
  message: MessageDetailDto;
  currentUserNickname?: string;
}

export default function MessageDetail({
  message,
  currentUserNickname,
}: MessageDetailProps) {
  const router = useRouter();

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-2xl font-bold">
            {message.isNotice ? "📢 공지 메시지" : "메시지"}
          </h1>
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              message.isNotice
                ? "bg-red-100 text-red-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {message.isNotice ? "공지" : "개인"}
          </span>
        </div>

        <div className="mb-4">
          <strong className="text-gray-700">발신자:</strong>{" "}
          <span className="ml-2 text-gray-900">{message.senderNickname}</span>
        </div>

        <div className="mb-6">
          <strong className="text-gray-700">내용:</strong>
          <div className="mt-2 p-4 bg-gray-50 rounded leading-relaxed text-gray-800 whitespace-pre-wrap">
            {message.content}
          </div>
        </div>

        <div className="text-sm text-gray-500">
          발신일: {new Date(message.createdAt).toLocaleString()}
        </div>
      </div>

      {/* 뒤로 가기 버튼 */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
        >
          뒤로 가기
        </button>
      </div>

      {/* 삭제 버튼 — 발신자만 보임 */}
      {currentUserNickname && (
        <DeleteButton
          messageId={message.id}
          senderNickname={message.senderNickname}
          currentUserNickname={currentUserNickname}
        />
      )}
    </div>
  );
}
