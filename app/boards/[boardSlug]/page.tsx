import VideoCard from "@/components/Boards/Shared/VideoCard";
import ErrorMessage from "@/components/errorMessage";
import LimitSelector from "@/components/Pagination/LimitSelector";
import { PaginationControls } from "@/components/Pagination/PaginationControls";
import { FetchAllBoards } from "@/lib/action/boardBrowseActions";
import { FetchPostsByBoardId } from "@/lib/action/postActions";
import { userStatus } from "@/lib/authState";
import {
  PaginatedPostsResponse,
  PaginationDtoSchema,
  VideoCardInfo,
} from "@/lib/definition";
import { canCreatePost } from "@/lib/util";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const boards = await FetchAllBoards();
  return boards.map((board) => ({ boardSlug: board.slug }));
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ boardSlug: string }>;
  searchParams: Promise<{
    page?: string;
    limit?: string;
    sort?: "createdAt" | "updatedAt";
    order?: "ASC" | "DESC";
  }>;
}) {
  const { boardSlug } = await params;
  const rawSearchParams = await searchParams;

  const boards = await FetchAllBoards();
  const currentBoard = boards.find((board) => board.slug === boardSlug);

  if (!currentBoard) {
    notFound();
  }

  const validatedSearchParams = PaginationDtoSchema.safeParse({
    ...rawSearchParams,
    page: Number(rawSearchParams.page) || 1,
    limit: Number(rawSearchParams.limit) || 10,
  });

  let data: PaginatedPostsResponse;
  let currentPage: number;
  let currentLimit: number;

  try {
    if (validatedSearchParams.success) {
      currentPage = validatedSearchParams.data.page;
      currentLimit = validatedSearchParams.data.limit;
      data = await FetchPostsByBoardId(currentBoard.id, currentBoard.slug, {
        page: validatedSearchParams.data.page,
        limit: validatedSearchParams.data.limit,
        sort: validatedSearchParams.data.sort,
        order: validatedSearchParams.data.order,
      });
    } else {
      currentPage = 1;
      currentLimit = 10;
      data = await FetchPostsByBoardId(currentBoard.id, currentBoard.slug, {
        page: currentPage,
        limit: currentLimit,
      });
    }
  } catch (error) {
    console.error(error);
    return <ErrorMessage message={"데이터를 불러오는 데 실패하였습니다."} />;
  }

  // VideoCardInfo 배열 생성
  const videos: VideoCardInfo[] = data.data.map((post) => ({
    id: post.id,
    title: post.title,
    nickname: post.nickname,
    createdAt: post.createdAt,
    videoUrl: post.videoUrl,
    channelTitle: post.channelTitle,
    duration: post.duration,
    source: post.source,
  }));

  const userStatusInfo = await userStatus();

  const isEditable = canCreatePost({
    user: userStatusInfo,
    board: currentBoard,
  });

  return (
    <div>
      <div className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold">{currentBoard.name}</h1>
        <p className="text-gray-600 mt-1">{currentBoard.description}</p>
      </div>
      <div className="space-y-4">
        {videos.length > 0 ? (
          videos.map((video) => (
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
      </div>
      <div className="flex justify-between items-center mt-4 mb-2">
        <div className="text-sm text-gray-600">
          현재 페이지: <span className="font-medium">{data.currentPage}</span> /{" "}
          {data.totalPages}
        </div>

        <LimitSelector
          currentLimit={currentLimit}
          baseUrl={`/boards/${boardSlug}`}
        />
      </div>
      <PaginationControls
        currentPage={data.currentPage}
        totalPages={data.totalPages}
        currentLimit={currentLimit}
        baseUrl={`/boards/${boardSlug}`}
      />
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
}
