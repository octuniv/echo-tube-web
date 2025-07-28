"use client";

import { useRouter } from "next/navigation";
import { deleteUser } from "@/lib/action/adminUserManagementApi";

export default function DeleteButton({
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
        router.refresh();
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
    <button
      onClick={handleDelete}
      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200"
    >
      삭제
    </button>
  );
}
