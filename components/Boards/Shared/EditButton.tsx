"use client";
import { PencilIcon } from "@heroicons/react/24/solid";
import Link from "next/link";

interface EditButtonProps {
  boardSlug: string;
  postId: number;
  isEditable: boolean;
}

export default function EditButton({
  boardSlug,
  postId,
  isEditable,
}: EditButtonProps) {
  return (
    <Link
      href={isEditable ? `/boards/${boardSlug}/edit/${postId}` : "#"}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
        ${
          isEditable
            ? "text-blue-600 hover:bg-blue-50"
            : "text-gray-400 cursor-not-allowed opacity-60 hover:bg-transparent"
        }`}
      aria-label="게시물 수정"
      aria-disabled={!isEditable}
      onClick={(e) => !isEditable && e.preventDefault()}
    >
      <PencilIcon className="w-5 h-5" />
      수정
    </Link>
  );
}
