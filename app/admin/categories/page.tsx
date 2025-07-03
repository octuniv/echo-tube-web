// app/admin/categories/page.tsx
import { fetchCategories } from "@/lib/action/adminCategoryManagementApi";
import Link from "next/link";

export default async function CategoryList() {
  let categories;

  try {
    categories = await fetchCategories();
  } catch (error) {
    return (
      <div className="p-6 text-red-600">
        {error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다."}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">카테고리 관리</h1>
        <Link
          href="/admin/categories/create"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          새로운 카테고리 생성
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-left">ID</th>
              <th className="py-3 px-4 text-left">이름</th>
              <th className="py-3 px-4 text-left">허용 슬러그</th>
              <th className="py-3 px-4 text-left">게시판 수</th>
              <th className="py-3 px-4 text-right">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {categories.map((category) => (
              <tr key={category.id} className="hover:bg-gray-50">
                <td className="py-3 px-4">{category.id}</td>
                <td className="py-3 px-4">{category.name}</td>
                <td className="py-3 px-4">
                  {category.allowedSlugs.join(", ")}
                </td>
                <td className="py-3 px-4">{category.boardIds.length}</td>
                <td className="py-3 px-4 flex justify-end gap-2">
                  <Link
                    href={`/admin/categories/${category.id}/edit`}
                    className="text-blue-600 hover:underline"
                  >
                    수정
                  </Link>
                  <form
                    action={`/admin/categories/${category.id}/delete`}
                    method="POST"
                  >
                    <button
                      type="submit"
                      className="text-red-600 hover:underline"
                    >
                      삭제
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
