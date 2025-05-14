import { VideoCardInfo } from "@/lib/definition";
import VideoCard from "../Shared/VideoCard";
import Link from "next/link";

interface BoardProps {
  boardSlug: string;
  sortedVideos: VideoCardInfo[];
  isEditable: boolean;
}

const Board: React.FC<BoardProps> = ({
  boardSlug,
  sortedVideos,
  isEditable,
}) => {
  return (
    <div className="space-y-4">
      {sortedVideos.length > 0 ? (
        sortedVideos.map((video) => (
          <VideoCard key={video.id} boardSlug={boardSlug} video={video} />
        ))
      ) : (
        <p
          className="text-center text-gray-500"
          aria-label="No posts available"
        >
          게시물이 없습니다.
        </p>
      )}
      {isEditable ? (
        <Link href={`/boards/${boardSlug}/create`}>
          <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors">
            게시물 작성
          </button>
        </Link>
      ) : (
        <button
          disabled
          className="px-4 py-2 bg-gray-300 text-white rounded cursor-not-allowed opacity-70"
          title="게시물 작성 권한이 없습니다"
          aria-disabled
        >
          게시물 작성
        </button>
      )}
    </div>
  );
};

export default Board;
