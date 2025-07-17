import EditBoardPage from "@/components/admin/boards/edit/EditBoardPage";
import { fetchBoardById } from "@/lib/action/adminBoardManagementApi";
import { getAvailableCategories } from "@/lib/action/adminCategoryManagementApi";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BoardUpdate({ params }: PageProps) {
  const { id } = await params;
  const boardId = Number(id);
  const board = await fetchBoardById(boardId);
  const categories = await getAvailableCategories(boardId);
  return <EditBoardPage categories={categories} boardData={board} />;
}
