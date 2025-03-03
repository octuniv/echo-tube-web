import { VideoCardInfo } from "@/lib/definition";
import VideoCard from "./VideoCard";
import Link from "next/link";

interface PostsProps {
  sortedVideos: VideoCardInfo[];
}

const Posts: React.FC<PostsProps> = ({ sortedVideos }) => {
  return (
    <div className="space-y-4">
      {sortedVideos.length > 0 ? (
        sortedVideos.map((video) => <VideoCard key={video.id} video={video} />)
      ) : (
        <p
          className="text-center text-gray-500"
          aria-label="No posts available"
        >
          게시물이 없습니다.
        </p>
      )}
      <Link href="/posts/create">
        <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
          게시물 작성
        </button>
      </Link>
    </div>
  );
};

export default Posts;
