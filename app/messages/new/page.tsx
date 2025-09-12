// app/messages/new/page.tsx
import PersonalMessageForm from "@/components/Message/PersonalMessageForm";
import { userStatus } from "@/lib/authState";
import { isValidUser } from "@/lib/util";
import { redirect } from "next/navigation";

export default async function NewMessagePage() {
  const userStatusInfo = await userStatus();

  if (!isValidUser(userStatusInfo)) {
    redirect(`/login`);
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">새 메시지 보내기</h1>
      <PersonalMessageForm />
    </div>
  );
}
