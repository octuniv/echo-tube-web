// components/message/MessageList.tsx
import MessageItem from "./MessageItem";
import { PaginatedMessageListDto } from "@/lib/definition/messageSchema";
import Link from "next/link";
import { PaginationControls } from "../Pagination/PaginationControls";

interface MessageListProps {
  messages: PaginatedMessageListDto;
}

export default function MessageList({ messages }: MessageListProps) {
  const { data, currentPage, totalPages } = messages;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">내 메시지함</h1>

      {data.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          메시지가 없습니다.{" "}
          <Link
            href="/messages/new"
            className="text-blue-600 hover:underline"
            data-testid="create-message-link"
            aria-label="새 메시지를 작성하기 위해 새 메시지 보내기 페이지로 이동"
          >
            새 메시지 보내기
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((msg) => (
            <MessageItem key={msg.id} message={msg} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          baseUrl="/messages"
          ariaLabel="메시지 목록"
        />
      )}
    </div>
  );
}
