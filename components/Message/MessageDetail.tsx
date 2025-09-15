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

  const formattedDate = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  }).format(new Date(message.createdAt));

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div
        className="bg-white rounded-lg shadow p-6"
        aria-label={`메시지 상세: ${message.senderNickname}에서 보낸 메시지, ${
          message.isNotice ? "공지" : "개인"
        } 메시지`}
      >
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-2xl font-bold" data-testid="message-detail-title">
            {" "}
            {message.isNotice ? "📢 공지 메시지" : "메시지"}
          </h1>
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              message.isNotice
                ? "bg-red-100 text-red-800"
                : "bg-blue-100 text-blue-800"
            }`}
            aria-label={message.isNotice ? "공지 메시지" : "개인 메시지"}
          >
            {message.isNotice ? "공지" : "개인"}
          </span>
        </div>

        <div className="mb-4">
          <strong className="text-gray-700">발신자:</strong>{" "}
          <span
            className="ml-2 text-gray-900"
            data-testid="message-sender-name"
            aria-label={`발신자: ${message.senderNickname}`}
          >
            {message.senderNickname}
          </span>
        </div>

        <div className="mb-6">
          <strong className="text-gray-700">내용:</strong>
          <div
            className="mt-2 p-4 bg-gray-50 rounded leading-relaxed text-gray-800 whitespace-pre-wrap"
            data-testid="message-content"
            aria-label={`메시지 내용: ${message.content}`}
          >
            {message.content}
          </div>
        </div>

        <div className="text-sm text-gray-500" data-testid="message-created-at">
          발신일: {formattedDate}
        </div>
      </div>

      {/* 뒤로 가기 버튼 */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={() => router.back()}
          aria-label="메시지 목록으로 돌아가기"
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
          data-testid="back-to-list-button"
        >
          뒤로 가기
        </button>
      </div>

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
