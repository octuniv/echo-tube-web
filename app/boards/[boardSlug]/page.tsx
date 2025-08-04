"use server";

import ErrorMessage from "@/components/errorMessage";
import LimitSelector from "@/components/Pagination/LimitSelector";
import { PaginationControls } from "@/components/Pagination/PaginationControls";
import { FetchAllBoards } from "@/lib/action/boardBrowseActions";
import { FetchPostsByBoardId } from "@/lib/action/postActions";
import { userStatus } from "@/lib/authState";
import { PaginatedPostsResponse, PaginationDtoSchema } from "@/lib/definition";
import { canCreatePost } from "@/lib/util";
import { notFound } from "next/navigation";
import BoardHeader from "@/components/Boards/Shared/BoardHeader";
import CreatePostButton from "@/components/Boards/Shared/CreatePostButton";
import Link from "next/link";

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

  if (data.currentPage > data.totalPages && data.totalPages > 0) {
    notFound();
  }

  const userStatusInfo = await userStatus();

  const isEditable = canCreatePost({
    user: userStatusInfo,
    board: currentBoard,
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <BoardHeader
        name={currentBoard.name}
        description={currentBoard.description}
      />

      <div className="mt-6 bg-white rounded-xl shadow-sm overflow-hidden">
        {/* 필터 및 정렬 컨트롤 */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <LimitSelector
                currentLimit={currentLimit}
                baseUrl={`/boards/${boardSlug}`}
              />
              {isEditable && <CreatePostButton boardSlug={boardSlug} />}
            </div>
          </div>
        </div>

        {/* 게시물 목록 */}
        <div className="divide-y divide-gray-200">
          {data.data.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                이 보드에 게시물이 없습니다.
              </p>
              {isEditable && (
                <Link
                  href={`/boards/${boardSlug}/create`}
                  className="mt-4 inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-medium"
                  aria-label="Create post first"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  첫 번째 게시물 작성하기
                </Link>
              )}
            </div>
          ) : (
            data.data.map((post) => (
              <Link
                key={post.id}
                href={`/boards/${boardSlug}/${post.id}`}
                className="block hover:bg-gray-50 transition-colors p-6"
                aria-label={`Go to post ${post.title}`}
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1 hover:text-blue-600 transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {post.content}
                    </p>
                    <div className="flex flex-wrap items-center text-sm text-gray-500 gap-y-1">
                      <span className="mr-3">작성자: {post.nickname}</span>
                      <span className="mr-3">조회 {post.views}</span>
                      <span className="mr-3">댓글 {post.commentsCount}</span>
                      {post.channelTitle && (
                        <span className="mr-3">채널: {post.channelTitle}</span>
                      )}
                      <span className="md:ml-auto">
                        {new Date(post.createdAt).toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* 페이지네이션 */}
        <div className="px-6 py-4 border-t bg-gray-50">
          <PaginationControls
            currentPage={data.currentPage}
            totalPages={data.totalPages}
            currentLimit={currentLimit}
            baseUrl={`/boards/${boardSlug}`}
          />
        </div>
      </div>
    </div>
  );
}
