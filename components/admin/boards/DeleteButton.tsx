"use client";

import { deleteBoard } from "@/lib/action/adminBoardManagementApi";

export function DeleteButton({ boardId }: { boardId: number }) {
  const handleDelete = async () => {
    if (confirm("정말 삭제하시겠습니까?")) {
      await deleteBoard(boardId);
    }
  };

  return (
    <button onClick={handleDelete} className="text-red-600 hover:underline">
      삭제
    </button>
  );
}
