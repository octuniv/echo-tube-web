import Link from "next/link";
import { VideoCardInfo } from "@/lib/definition";

interface CardProps {
  boardSlug: string;
  video: VideoCardInfo;
  isAiDigest?: boolean;
}

export default function VideoCard({
  boardSlug,
  video,
  isAiDigest = false,
}: Readonly<CardProps>) {
  const {
    id,
    title,
    nickname: author,
    createdAt: date,
    videoUrl: link,
    channelTitle,
    duration,
    source,
  } = video;
  const pageLink = `/boards/${boardSlug}/${id}`;

  return (
    <div className="border p-4 rounded-lg shadow-md hover:bg-gray-50 transition">
      {/* Link 컴포넌트를 사용하여 전체 카드 클릭 가능 */}
      <Link
        href={pageLink}
        aria-label={`Go to post ${id}: ${title}`}
        className="block"
      >
        <h2
          className="text-xl font-semibold"
          aria-label={`Post title: ${title}`}
        >
          {title}
        </h2>
        <p
          className="text-gray-600"
          aria-label={`Author of the post: ${author}`}
        >
          작성자: {author}
        </p>
        <p
          className="text-gray-500 text-sm"
          aria-label={`Post creation date: ${date}`}
        >
          작성일: {date}
        </p>
      </Link>

      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline mt-2 block"
          aria-label={`External video link: ${link}`}
        >
          {link}
        </a>
      )}

      {isAiDigest && (
        <div className="mt-3 text-sm text-gray-700 space-y-1">
          {channelTitle && <p>채널: {channelTitle}</p>}
          {duration && <p>길이: {duration}</p>}
          {source && <p>출처: {source}</p>}
        </div>
      )}
    </div>
  );
}
