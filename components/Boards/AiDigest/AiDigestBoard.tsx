// app/components/Boards/AiDigestBoard.tsx
import { VideoCardInfo } from "@/lib/definition";
import VideoCard from "../Shared/VideoCard";

interface AiDigestBoardProps {
  boardSlug: string;
  sortedVideos: VideoCardInfo[];
}

const AiDigestBoard: React.FC<AiDigestBoardProps> = ({
  boardSlug,
  sortedVideos,
}) => {
  return (
    <div className="space-y-6">
      {/* 큐레이션 배지 표시 */}
      <div className="flex items-center gap-2 text-sm text-blue-600">
        <span className="bg-blue-100 px-2 py-0.5 rounded">AI 큐레이션</span>
        <span className="text-gray-500">봇이 자동으로 수집한 추천 영상</span>
      </div>

      {/* 영상 그리드 뷰 */}
      {sortedVideos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedVideos.map((video) => (
            <VideoCard
              key={video.id}
              boardSlug={boardSlug}
              video={video}
              isAiDigest={true} // VideoCard에 AI_DIGEST 타입 전달
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 py-8">
          아직 수집된 영상이 없습니다.
        </p>
      )}
    </div>
  );
};

export default AiDigestBoard;
