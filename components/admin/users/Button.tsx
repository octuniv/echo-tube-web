"use client";

import { useRouter } from "next/navigation";
import { deleteUser } from "@/lib/actions";

export default function DeleteUserButton({
  userId,
  userNickname,
}: {
  userId: number;
  userNickname: string;
}) {
  const router = useRouter();

  const handleDelete = async () => {
    if (confirm(`정말 ${userNickname}님을 삭제하시겠습니까?`)) {
      try {
        await deleteUser(userId);
        router.refresh(); // Refresh the page to update the user list
      } catch (error) {
        let errorMessage = "알 수 없는 오류가 발생했습니다.";

        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (
          typeof error === "object" &&
          error !== null &&
          "message" in error
        ) {
          errorMessage =
            (error as { message?: string }).message ?? errorMessage;
        } else if (typeof error === "string") {
          errorMessage = error;
        }

        alert(errorMessage);
      }
    }
  };

  return (
    <button onClick={handleDelete} className="text-red-500 hover:underline">
      삭제
    </button>
  );
}
