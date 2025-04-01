import { VideoCardInfo } from "@/lib/definition";
import VideoCard from "./VideoCard";
import Link from "next/link";

interface BoardProps {
  boardSlug: string;
  sortedVideos: VideoCardInfo[];
}

const Board: React.FC<BoardProps> = ({ boardSlug, sortedVideos }) => {
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
      <Link href={`/boards/${boardSlug}/create`}>
        <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
          게시물 작성
        </button>
      </Link>
    </div>
  );
};

export default Board;
