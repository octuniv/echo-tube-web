import Board from "@/components/Boards/Board";
import { FetchAllBoards, FetchPostsByBoardId } from "@/lib/actions";
import { PostDto, VideoCardInfo } from "@/lib/definition";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const boards = await FetchAllBoards();
  return boards.map((board) => ({ boardSlug: board.slug }));
}

export const revalidate = 3600;

const Page = async ({ params }: { params: Promise<{ boardSlug: string }> }) => {
  const { boardSlug } = await params;

  const boards = await FetchAllBoards();
  const currentBoard = boards.find((board) => board.slug === boardSlug);

  if (!currentBoard) {
    notFound();
  }

  let videoData: VideoCardInfo[] = [];

  const posts = await FetchPostsByBoardId(currentBoard.id);
  videoData = posts.map((post: PostDto) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { content, updatedAt, ...data } = post;
    return data satisfies VideoCardInfo;
  });

  const sortedVideoData = videoData.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return <Board boardSlug={boardSlug} sortedVideos={sortedVideoData} />;
};

export default Page;
