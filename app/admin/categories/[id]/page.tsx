import { GoToCategoriesLink } from "@/components/admin/categories/GoToCategoriesLink";
import ErrorMessage from "@/components/errorMessage";
import UnauthorizedRedirect from "@/components/UnauthorizedRedirect";
import { fetchCategoryById } from "@/lib/action/adminCategoryManagementApi";
import { ERROR_MESSAGES } from "@/lib/constants/errorMessage";
import { BoardSummary } from "@/lib/definition/admin/adminCategoryManagementSchema";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface pageProps {
  params: Promise<{
    id: string;
  }>;
}

interface MetadataCardProps {
  title: string;
  value: string | number | Date;
  isDate?: boolean;
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="h-10 bg-gray-200 rounded w-3/4"></div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-24 bg-gray-200 rounded"></div>
        <div className="h-24 bg-gray-200 rounded"></div>
      </div>

      <div className="h-96 bg-gray-200 rounded"></div>
    </div>
  );
}

function MetadataCard({ title, value, isDate = false }: MetadataCardProps) {
  const displayValue = isDate
    ? new Date(value as Date | string).toLocaleString()
    : value;

  return (
    <div
      className="bg-white rounded-lg shadow-sm border p-6"
      aria-label={`MetadataCard : ${title}`}
    >
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="mt-2 text-xl font-semibold text-gray-900">
        {String(displayValue)}
      </p>
    </div>
  );
}

function BoardList({ boards }: { boards: BoardSummary[] }) {
  if (!boards.length) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No boards associated with this category</p>
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden bg-white rounded-lg border"
      aria-label="BoardList"
    >
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Slug
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Required Role
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {boards.map((board) => (
            <tr key={board.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {board.id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {board.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {board.slug}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                {board.type}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                {board.requiredRole}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function CategoryDetail({ params }: pageProps) {
  const { id } = await params;
  const categoryId = Number(id);
  let category;
  let message: string;

  try {
    category = await fetchCategoryById(categoryId);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === ERROR_MESSAGES.FORBIDDEN) {
        return <UnauthorizedRedirect />;
      }
      message = error.message;
    } else {
      message = "Failed to load category details. Please try again later.";
    }

    return <ErrorMessage message={message} />;
  }

  if (!category) {
    return notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {category.name} <span className="text-gray-500">#{category.id}</span>
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Detailed information about the category
        </p>
      </div>

      {/* Metadata cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <MetadataCard title="Category Name" value={category.name} />
        <MetadataCard
          title="Allowed Slugs"
          value={category.allowedSlugs.join(", ")}
        />
        <MetadataCard
          title="Created At"
          value={category.createdAt}
          isDate={true}
        />
        <MetadataCard
          title="Updated At"
          value={category.updatedAt}
          isDate={true}
        />
      </div>

      {/* Boards section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Associated Boards
        </h2>
        <Suspense fallback={<LoadingSkeleton />}>
          <BoardList boards={category.boards} />
        </Suspense>
      </div>

      {/* Back button */}
      <div className="mt-8">
        <GoToCategoriesLink />
      </div>
    </div>
  );
}
