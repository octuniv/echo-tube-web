// components/AdminUserList.tsx

import { deleteUser } from "@/lib/actions";
import { AdminUserListResponseDto } from "@/lib/definition";

interface UserItemProps {
  user: AdminUserListResponseDto;
}

export function DeleteUserItem({ user }: UserItemProps) {
  const handleDelete = async () => {
    if (confirm(`정말 ${user.nickname}님을 삭제하시겠습니까?`)) {
      await deleteUser(user.id);
    }
  };

  return (
    <div className="flex justify-between items-center p-2 border-b">
      <span>{user.nickname}</span>
      <button
        onClick={handleDelete}
        className="text-red-500 hover:text-red-700"
      >
        삭제
      </button>
    </div>
  );
}
