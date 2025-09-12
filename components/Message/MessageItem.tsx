// components/message/MessageItem.tsx
"use client";
import Link from "next/link";
import { MessageListItemDto } from "@/lib/definition/messageSchema";

interface MessageItemProps {
  message: MessageListItemDto;
}

export default function MessageItem({ message }: MessageItemProps) {
  return (
    <Link
      href={`/messages/${message.id}`}
      className={`block p-4 border rounded-lg transition-all hover:shadow-md ${
        message.isRead
          ? "bg-white border-gray-200"
          : "bg-blue-50 border-blue-200"
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">
            {message.senderNickname}
          </h3>
          <p className="text-gray-600 mt-1 line-clamp-2">{message.preview}</p>
          <p className="text-xs text-gray-400 mt-2">
            {new Date(message.createdAt).toLocaleString()}
          </p>
        </div>
        {!message.isRead && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ml-4">
            새 메시지
          </span>
        )}
      </div>
    </Link>
  );
}
