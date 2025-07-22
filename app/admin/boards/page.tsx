import { DeleteButton } from "@/components/admin/boards/DeleteButton";
import UnauthorizedRedirect from "@/components/UnauthorizedRedirect";
import { fetchBoards } from "@/lib/action/adminBoardManagementApi";
import { fetchCategories } from "@/lib/action/adminCategoryManagementApi";
import { ERROR_MESSAGES } from "@/lib/constants/errorMessage";
import { AdminBoardResponse } from "@/lib/definition/adminBoardManagementSchema";
import { CategorySummary } from "@/lib/definition/adminCategoryManagementSchema";
import Link from "next/link";

export const dynamic = "force-dynamic";

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6">
      <h3 className="text-red-800 font-medium">Error</h3>
      <p className="text-red-700">{message}</p>
    </div>
  );
}

export default async function BoardList() {
  let categories: CategorySummary[];
  let boards: AdminBoardResponse[];
  let errorMessage: string;

  try {
    categories = await fetchCategories();
    boards = await fetchBoards();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === ERROR_MESSAGES.FORBIDDEN) {
        return <UnauthorizedRedirect />;
      }
      errorMessage = error.message;
    } else {
      errorMessage = "서버로부터 정보를 받아오는 데 실패하였습니다.";
    }
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorMessage message={errorMessage} />
      </div>
    );
  }

  const boardMap = boards.reduce((acc, board) => {
    if (!acc[board.categoryId]) {
      acc[board.categoryId] = [];
    }
    acc[board.categoryId].push(board);
    return acc;
  }, {} as Record<number, AdminBoardResponse[]>);

  const categorized = categories.map((category) => ({
    categoryName: category.name,
    categoryId: category.id,
    boards: boardMap[category.id] || [],
  }));

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-end">
        <Link
          href="/admin/boards/create"
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
        >
          새로운 보드 생성
        </Link>
      </div>
      {categories.length === 0 ? (
        <p className="text-gray-500">등록된 카테고리가 없습니다.</p>
      ) : (
        categorized.map((category) => (
          <div key={category.categoryId} className="space-y-4">
            <h2 className="text-xl font-bold text-blue-600 border-l-4 border-blue-500 pl-2">
              {category.categoryName}
            </h2>
            {category.boards.length === 0 ? (
              <p className="text-gray-500 pl-6">등록된 게시판이 없습니다.</p>
            ) : (
              <div className="overflow-x-auto">
                <table
                  className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm"
                  data-category={category.categoryName}
                >
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="px-4 py-2 text-left">이름</th>
                      <th className="px-4 py-2 text-left">슬러그</th>
                      <th className="px-4 py-2 text-left">필요 권한</th>
                      <th className="px-3 py-2 text-left">타입</th>
                      <th className="px-3 py-2 text-right">작업</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {category.boards.map((board) => (
                      <tr
                        key={board.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td data-role="name" className="px-4 py-2">
                          {board.name}
                        </td>
                        <td
                          data-role="slug"
                          className="px-4 py-2 text-blue-600 font-mono"
                        >
                          {board.slug}
                        </td>
                        <td data-role="requiredRole" className="px-4 py-2">
                          {board.requiredRole}
                        </td>
                        <td data-role="type" className="px-4 py-2">
                          {board.type}
                        </td>
                        <td className="px-4 py-2 flex justify-end gap-2">
                          <Link
                            href={`/admin/boards/${board.id}`}
                            className="text-gray-600 hover:underline"
                          >
                            상세
                          </Link>
                          <Link
                            href={`/admin/boards/edit/${board.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            수정
                          </Link>
                          <DeleteButton boardId={board.id} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
