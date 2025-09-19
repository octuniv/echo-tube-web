// app/messages/page.tsx
import { FetchMessages } from "@/lib/action/messageActions";
import MessageList from "@/components/Message/MessageList";
import { userStatus } from "@/lib/authState";
import { isValidUser } from "@/lib/util";
import { redirect } from "next/navigation";

interface MessagePageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function MessagesPage({ searchParams }: MessagePageProps) {
  const userStatusInfo = await userStatus();

  if (!isValidUser(userStatusInfo)) {
    redirect(`/login`);
  }

  let messagePage = 1;
  const { page } = await searchParams;

  if (page) {
    const pageParam = Array.isArray(page) ? page[0] : page;
    const pageNum = Number(pageParam);
    if (!isNaN(pageNum) && pageNum > 0) {
      messagePage = pageNum;
    }
  }

  const messages = await FetchMessages(messagePage);

  return <MessageList messages={messages} />;
}
