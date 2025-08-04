"use client";

import { useRouter } from "next/navigation";
import { TrashIcon } from "@heroicons/react/24/solid";
import { DeletePost } from "@/lib/action/postActions";

interface DeleteButtonProps {
  postId: number;
  boardSlug: string;
  isEditable: boolean;
}

export default function DeleteButton({
  postId,
  boardSlug,
  isEditable,
}: DeleteButtonProps) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!isEditable) return;
    if (!confirm("정말로 이 게시물을 삭제하시겠습니까?")) return;

    try {
      console.log("Deleting post...", { postId, boardSlug });
      const result = await DeletePost(postId, boardSlug);
      console.log("Delete result:", result);

      // 타입 가드를 통해 결과 객체의 유효성 확인
      if (result && typeof result === "object") {
        if (result.success && result.redirectUrl) {
          // 라우팅 전에 잠시 대기하여 캐시 무효화가 완료되도록 함
          await new Promise((resolve) => setTimeout(resolve, 300));
          router.push(result.redirectUrl);
          router.refresh(); // 추가로 페이지 새로 고침
        } else if (result.redirectUrl) {
          await new Promise((resolve) => setTimeout(resolve, 300));
          router.push(result.redirectUrl);
        } else if (result.error) {
          alert(`삭제 중 오류가 발생했습니다: ${result.error}`);
        } else {
          alert("삭제 중 알 수 없는 오류가 발생했습니다.");
        }
      } else {
        alert("서버 응답이 올바르지 않습니다.");
      }
    } catch (err) {
      console.error("Delete operation failed:", err);
      alert("삭제 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <button
      onClick={handleDelete}
      className={`flex items-center font-bold py-2 px-4 rounded focus:outline-none ${
        isEditable
          ? "bg-red-500 hover:bg-red-700 text-white cursor-pointer"
          : "text-gray-500 cursor-not-allowed"
      }`}
      aria-label="게시물 삭제"
      disabled={!isEditable}
    >
      <TrashIcon className="h-5 w-5 mr-2" />
      삭제
    </button>
  );
}
