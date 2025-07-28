import Board from "@/components/Boards/AiDigest/AiDigestBoard"; // 영상 중심 UI 컴포넌트
import { FetchAllBoards } from "@/lib/action/boardBrowseActions";
import { FetchPostsByBoardId } from "@/lib/action/postActions";
import { BoardPurpose, VideoCardInfo } from "@/lib/definition";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const boards = await FetchAllBoards();
  return boards
    .filter((board) => board.boardType === BoardPurpose.AI_DIGEST)
    .map((board) => ({ boardSlug: board.slug }));
}

export const revalidate = 3600; // 일반 게시판과 동일한 캐시 정책

const Page = async ({ params }: { params: Promise<{ boardSlug: string }> }) => {
  const { boardSlug } = await params;

  const boards = await FetchAllBoards();
  const currentBoard = boards.find(
    (board) =>
      board.slug === boardSlug && board.boardType === BoardPurpose.AI_DIGEST
  );

  if (!currentBoard) notFound();

  const posts = await FetchPostsByBoardId(currentBoard.id);
  const sortedVideos = posts
    .filter((post) => post.videoUrl) // 영상 URL 필수 검증
    .map(
      (post): VideoCardInfo => ({
        id: post.id,
        title: post.title,
        nickname: post.nickname,
        createdAt: post.createdAt,
        videoUrl: post.videoUrl,
        channelTitle: post.channelTitle,
        duration: post.duration,
        source: post.source,
      })
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  return <Board boardSlug={boardSlug} sortedVideos={sortedVideos} />;
};

export default Page;
