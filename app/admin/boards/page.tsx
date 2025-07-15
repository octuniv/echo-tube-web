import { fetchBoards } from "@/lib/action/adminBoardManagementApi";
import { fetchCategories } from "@/lib/action/adminCategoryManagementApi";
import { AdminBoardResponse } from "@/lib/definition/adminBoardManagementSchema";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function BoardList() {
  let categories;
  let boards;

  try {
    categories = await fetchCategories();
    boards = await fetchBoards();
  } catch (error) {
    return (
      <div className="p-6 text-red-600">
        {error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다."}
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
