import EditBoardPage from "@/components/admin/boards/edit/EditBoardPage";
import ErrorMessage from "@/components/errorMessage";
import UnauthorizedRedirect from "@/components/UnauthorizedRedirect";
import { fetchBoardById } from "@/lib/action/adminBoardManagementApi";
import { getAvailableCategories } from "@/lib/action/adminCategoryManagementApi";
import { ERROR_MESSAGES } from "@/lib/constants/errorMessage";
import { AdminBoardResponse } from "@/lib/definition/admin/adminBoardManagementSchema";
import { AvailableCategoriesResponse } from "@/lib/definition/admin/adminCategoryManagementSchema";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BoardUpdate({ params }: PageProps) {
  const { id } = await params;
  const boardId = Number(id);

  let board: AdminBoardResponse | null;
  let categories: AvailableCategoriesResponse;
  let errorMessage: string;

  try {
    board = await fetchBoardById(boardId);
    categories = await getAvailableCategories(boardId);
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

  if (!board) {
    notFound();
  }
  return <EditBoardPage categories={categories} boardData={board} />;
}
