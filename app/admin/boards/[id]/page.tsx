import UnauthorizedRedirect from "@/components/UnauthorizedRedirect";
import { fetchBoardById } from "@/lib/action/adminBoardManagementApi";
import { ERROR_MESSAGES } from "@/lib/constants/errorMessage";
import { AdminBoardResponse } from "@/lib/definition/adminBoardManagementSchema";
import Link from "next/link";
import { notFound } from "next/navigation";

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6">
      <h3 className="text-red-800 font-medium">Error</h3>
      <p className="text-red-700">{message}</p>
    </div>
  );
}

export default async function BoardDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = Number((await params).id);
  let boardData: AdminBoardResponse | null;
  let errorMessage: string;
  try {
    boardData = await fetchBoardById(id);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === ERROR_MESSAGES.FORBIDDEN) {
        return <UnauthorizedRedirect />;
      } else {
        errorMessage = error.message;
      }
    } else {
      errorMessage = "서버로부터 정보를 받아오는 데 실패했습니다.";
    }
    return <ErrorMessage message={errorMessage} />;
  }

  if (!boardData) {
    notFound();
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{boardData.name}</h1>
        <Link
          href="/admin/boards"
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          Back to Boards
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          <div className="space-y-2">
            <p>
              <span className="font-medium">Slug:</span> {boardData.slug}
            </p>
            <p>
              <span className="font-medium">Description:</span>{" "}
              {boardData.description || "N/A"}
            </p>
            <p>
              <span className="font-medium">Type:</span>
              <span className="ml-2 inline-block px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                {boardData.type}
              </span>
            </p>
            <p>
              <span className="font-medium">Required Role:</span>
              <span className="ml-2 inline-block px-2 py-1 text-sm bg-purple-100 text-purple-800 rounded-full">
                {boardData.requiredRole}
              </span>
            </p>
          </div>
        </div>

        {/* Category Info */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Category</h2>
          <div className="space-y-2">
            <p>
              <span className="font-medium">ID:</span> {boardData.categoryId}
            </p>
            <p>
              <span className="font-medium">Name:</span>{" "}
              {boardData.categoryName}
            </p>
          </div>
        </div>

        {/* Timestamps */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Timestamps</h2>
          <div className="space-y-2">
            <p>
              <span className="font-medium">Created:</span>{" "}
              {formatDateTime(boardData.createdAt)}
            </p>
            <p>
              <span className="font-medium">Updated:</span>{" "}
              {formatDateTime(boardData.updatedAt)}
            </p>
            {boardData.deletedAt && (
              <p className="text-red-500">
                <span className="font-medium">Deleted:</span>{" "}
                {formatDateTime(boardData.deletedAt)}
              </p>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Status</h2>
          <div className="flex items-center space-x-2">
            {boardData.deletedAt ? (
              <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                Archived
              </span>
            ) : (
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                Active
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
