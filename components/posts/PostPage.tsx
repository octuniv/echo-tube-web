"use client";

import { PostDto } from "@/lib/definition";
import DeleteButton from "./DeleteButton";
import EditButton from "./EditButton";

interface PostPageProps {
  post: PostDto; // URL에서 전달되는 게시물 ID
  isEditable: boolean;
}

export default function PostPage({ post, isEditable }: PostPageProps) {
  return (
    <div className="container mx-auto p-6">
      {/* 제목 */}
      <h1
        className="text-3xl font-bold text-gray-800 mb-4"
        aria-label={`게시물 제목: ${post.title}`}
      >
        {post.title}
      </h1>

      {/* 작성자 정보 */}
      <div
        className="flex items-center text-sm text-gray-500 mb-6"
        aria-label="작성자 및 작성일 정보"
      >
        <span className="mr-2">작성자: {post.nickName}</span>
        <span>작성일: {new Date(post.createdAt).toLocaleDateString()}</span>
      </div>

      {/* 본문 내용 */}
      <div className="prose max-w-full mb-6" aria-label="게시물 본문 내용">
        <p>{post.content}</p>
      </div>

      {/* 비디오 링크 (옵션) */}
      {post.videoUrl ? (
        isValidVideoUrl(post.videoUrl) ? (
          <div className="mb-6" aria-label="게시물에 포함된 비디오">
            <iframe
              src={convertToEmbedUrl(post.videoUrl)}
              title="Video"
              width="100%"
              height="400"
              allowFullScreen
              className="rounded-lg shadow-md"
            ></iframe>
          </div>
        ) : (
          <div
            className="mb-6 text-red-500"
            aria-label="유효하지 않은 비디오 링크"
          >
            비디오를 로드할 수 없습니다. 제공된 링크가 유효하지 않습니다.
          </div>
        )
      ) : null}

      {/* 수정일 표시 */}
      <div className="text-xs text-gray-400" aria-label="게시물 마지막 수정일">
        마지막 수정일: {new Date(post.updatedAt).toLocaleDateString()}
      </div>

      {/* 버튼 컨테이너 */}
      <div className="mt-6 flex justify-end gap-4">
        <EditButton postId={post.id} isEditable={isEditable} />
        <DeleteButton postId={post.id} isEditable={isEditable} />
      </div>
    </div>
  );
}

// YouTube 동영상 URL을 임베드 URL로 변환
function convertToEmbedUrl(url: string): string {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    throw new Error("Invalid YouTube URL");
  }
  return `https://www.youtube.com/embed/${videoId}`;
}

// YouTube 동영상 ID 추출
function extractYouTubeVideoId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

// URL 유효성 검사
function isValidVideoUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    const isYouTube =
      parsedUrl.hostname.includes("youtube.com") ||
      parsedUrl.hostname.includes("youtu.be");
    const videoId = extractYouTubeVideoId(url);
    return isYouTube && !!videoId;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return false;
  }
}
