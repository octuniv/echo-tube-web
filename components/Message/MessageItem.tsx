// components/message/MessageItem.tsx
"use client";
import Link from "next/link";
import { MessageListItemDto } from "@/lib/definition/messageSchema";

interface MessageItemProps {
  message: MessageListItemDto;
}

export default function MessageItem({ message }: MessageItemProps) {
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
    <Link
      href={`/messages/${message.id}`}
      data-testid={`message-item-${message.id}`}
      aria-label={`${message.senderNickname}에게서 온 메시지, ${
        message.isRead ? "읽음" : "읽지 않음"
      }`}
      className={`block p-4 border rounded-lg transition-all hover:shadow-md ${
        message.isRead
          ? "bg-white border-gray-200"
          : "bg-blue-50 border-blue-200"
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3
            className="font-medium text-gray-900"
            data-testid={`sender-name-${message.id}`}
          >
            {message.senderNickname}
          </h3>
          <p
            className="text-gray-600 mt-1 line-clamp-2"
            data-testid={`message-preview-${message.id}`}
          >
            {message.preview}
          </p>
          <p
            className="text-xs text-gray-400 mt-2"
            data-testid={`message-date-${message.id}`}
          >
            {formattedDate}
          </p>
        </div>

        {!message.isRead && (
          <span
            data-testid={`unread-badge-${message.id}`}
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ml-4"
            role="status"
            aria-label="읽지 않은 메시지"
          >
            새 메시지
          </span>
        )}
      </div>
    </Link>
  );
}
