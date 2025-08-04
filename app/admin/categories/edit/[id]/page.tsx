import UpdateCategoryPage from "@/components/admin/categories/edit/UpdateCategoryPage";
import ErrorMessage from "@/components/errorMessage";
import UnauthorizedRedirect from "@/components/UnauthorizedRedirect";
import { fetchCategoryById } from "@/lib/action/adminCategoryManagementApi";
import { ERROR_MESSAGES } from "@/lib/constants/errorMessage";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CategoryUpdate({ params }: PageProps) {
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
      message = "알 수 없는 오류가 발생했습니다.";
    }
    return <ErrorMessage message={message} />;
  }

  if (!category) {
    return notFound();
  }

  const categoryData = {
    name: category.name,
    allowedSlugs: category.allowedSlugs,
  };

  return (
    <UpdateCategoryPage categoryId={categoryId} categoryData={categoryData} />
  );
}
