"use client";
import { deleteCategory } from "@/lib/action/adminCategoryManagementApi";

export function DeleteButton({ categoryId }: { categoryId: number }) {
  const handleDelete = async () => {
    if (confirm("정말 삭제하시겠습니까?")) {
      await deleteCategory(categoryId);
    }
  };

  return (
    <button onClick={handleDelete} className="text-red-600 hover:underline">
      삭제
    </button>
  );
}
