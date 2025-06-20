"use client";

// components/DeleteButton.tsx
import { DeletePost } from "@/lib/actions";
import { TrashIcon } from "@heroicons/react/24/solid"; // 휴지통 아이콘 사용

interface DeleteButtonProps {
  postId: number; // 삭제할 게시물 ID
  boardSlug: string; // 현재 게시판의 slug
  isEditable: boolean; // 편집 가능 여부
}

export default function DeleteButton({
  postId,
  boardSlug,
  isEditable,
}: DeleteButtonProps) {
  // 삭제 핸들러
  const handleDelete = async () => {
    if (!isEditable) return;

    if (confirm("정말로 이 게시물을 삭제하시겠습니까?")) {
      try {
        await DeletePost(postId, boardSlug);
      } catch (err) {
        alert("삭제 중 오류가 발생했습니다. 다시 시도해주세요.");
        console.error("삭제 실패:", err);
      }
    }
  };

  return (
    <button
      onClick={isEditable ? handleDelete : undefined} // isEditable이 false면 onClick 핸들러를 제거
      className={`flex items-center font-bold py-2 px-4 rounded focus:outline-none ${
        isEditable
          ? "bg-red-500 hover:bg-red-700 text-white cursor-pointer"
          : "text-gray-500 cursor-not-allowed" // 비활성화 상태 스타일
      }`}
      aria-label="게시물 삭제"
      disabled={!isEditable} // 버튼 비활성화
    >
      <TrashIcon className="h-5 w-5 mr-2" /> {/* 휴지통 아이콘 */}
      삭제
    </button>
  );
}
