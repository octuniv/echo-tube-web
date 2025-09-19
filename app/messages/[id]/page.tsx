// app/messages/[id]/page.tsx
import { FetchMessage } from "@/lib/action/messageActions";
import MessageDetail from "@/components/Message/MessageDetail";
import { userStatus } from "@/lib/authState";
import { isValidUser } from "@/lib/util";
import { redirect } from "next/navigation";
import { MessageErrors } from "@/lib/constants/message/constants";
import Link from "next/link";

export default async function MessageDetailPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;
  const messageId = Number(id);
  if (isNaN(messageId)) {
    return (
      <div className="p-6 text-red-600 bg-red-50 rounded-lg">
        유효하지 않은 메시지 ID입니다.
      </div>
    );
  }
  const userStatusInfo = await userStatus();
  if (!isValidUser(userStatusInfo)) {
    redirect(`/login`);
  }
  const message = await FetchMessage(messageId);
  if ("message" in message) {
    switch (message.message) {
      case MessageErrors.MESSAGE_NOT_FOUND:
        return (
          <div
            className="p-6 text-center"
            data-testid="message-not-found-container"
            aria-label={`ID ${messageId}의 메시지를 찾을 수 없습니다.`}
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              메시지를 찾을 수 없습니다.
            </h2>
            <p className="text-gray-600">
              해당 메시지는 삭제되었거나 존재하지 않습니다.
            </p>
            <Link
              href="/messages"
              className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition inline-block"
            >
              리스트로 돌아가기
            </Link>
          </div>
        );
      default:
        console.error("Unexpected error fetching message:", message.message);
        return (
          <div
            className="p-6 text-center"
            data-testid="message-fetch-error-container"
            aria-label="메시지 조회 중 오류가 발생했습니다."
          >
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              오류가 발생했습니다.
            </h2>
            <p className="text-gray-600 mb-4">잠시 후 다시 시도해 주세요.</p>
            <Link
              href="/messages"
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition inline-block"
            >
              리스트로 돌아가기
            </Link>
          </div>
        );
    }
  }
  return <MessageDetail message={message} />;
}
