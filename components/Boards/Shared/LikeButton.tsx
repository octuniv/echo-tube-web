"use client";

import { useState } from "react";
import { LikePost } from "@/lib/action/postActions";
import { toast } from "react-hot-toast";

interface LikeButtonProps {
  postId: number;
  boardSlug: string;
  initialLikesCount: number;
  isLoggedIn: boolean;
  isUserLiked?: boolean;
}

export default function LikeButton({
  postId,
  boardSlug,
  initialLikesCount,
  isLoggedIn,
  isUserLiked: initialIsUserLiked = false,
}: LikeButtonProps) {
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isUserLiked, setIsUserLiked] = useState(initialIsUserLiked);
  const [isLoading, setIsLoading] = useState(false);

  const handleLike = async () => {
    // 로그인하지 않은 경우
    if (!isLoggedIn) {
      toast.error("로그인이 필요한 기능입니다.");
      return;
    }
    // 이미 좋아요를 누르거나 로딩 중인 경우 무시
    if (isLoading || isUserLiked) return;

    // 낙관적 업데이트: 요청 전에 UI 먼저 변경
    setIsLoading(true);
    setLikesCount((prev) => prev + 1);
    setIsUserLiked(true);

    const result = await LikePost(postId, boardSlug);

    if ("message" in result) {
      // 서버에서 반환한 메시지 처리
      toast.error(result.message || "좋아요 처리에 실패했습니다.");
      // 낙관적 업데이트 롤백
      setLikesCount((prev) => prev - 1);
      setIsUserLiked(false);
    } else if (result.isAdded === false) {
      setLikesCount((prev) => prev - 1);
    }

    setIsLoading(false);
  };

  const buttonContent = (
    <button
      onClick={handleLike}
      disabled={isLoading || isUserLiked || !isLoggedIn}
      className={`flex items-center gap-1 px-3 py-1 rounded transition-all duration-200 ${
        !isLoggedIn
          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
          : isUserLiked
          ? "bg-red-100 text-red-500 cursor-not-allowed"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      } ${isLoading ? "opacity-70" : ""}`}
      aria-label={
        !isLoggedIn
          ? "로그인 후 좋아요를 누를 수 있습니다"
          : isUserLiked
          ? "이미 좋아요를 누르셨습니다"
          : "이 게시물을 좋아요"
      }
      title={
        !isLoggedIn
          ? "로그인 후 좋아요를 누를 수 있습니다"
          : isUserLiked
          ? "이미 좋아요를 누르셨습니다"
          : ""
      }
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        viewBox="0 0 20 20"
        fill={isUserLiked ? "currentColor" : "none"}
        stroke={isUserLiked ? "none" : "currentColor"}
        strokeWidth={isUserLiked ? "0" : "1.5"}
      >
        <path
          fillRule="evenodd"
          d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
          clipRule="evenodd"
        />
      </svg>
      <span>{likesCount}</span>
    </button>
  );

  return buttonContent;
}
