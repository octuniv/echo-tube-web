import CreateBoardPage from "@/components/admin/boards/create/CreateBoardPage";
import ErrorMessage from "@/components/errorMessage";
import UnauthorizedRedirect from "@/components/UnauthorizedRedirect";
import { getAvailableCategories } from "@/lib/action/adminCategoryManagementApi";
import { ERROR_MESSAGES } from "@/lib/constants/errorMessage";

export const dynamic = "force-dynamic";

export default async function BoardCreate() {
  let errorMessage: string;
  try {
    const categories = await getAvailableCategories();
    return <CreateBoardPage categories={categories} />;
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
}
