import CreateBoardPage from "@/components/admin/boards/create/CreateBoardPage";
import { getAvailableCategories } from "@/lib/action/adminCategoryManagementApi";

export const dynamic = "force-dynamic";

export default async function BoardCreate() {
  const categories = await getAvailableCategories();
  return <CreateBoardPage categories={categories} />;
}
