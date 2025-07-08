import UpdateCategoryPage from "@/components/admin/categories/edit/UpdateCategoryPage";
import { GoToCategoriesLink } from "@/components/admin/categories/GoToCategoriesLink";
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

  try {
    const category = await fetchCategoryById(categoryId);

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
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === ERROR_MESSAGES.NOT_FOUND) {
        return notFound();
      }
      return (
        <div className="error-container">
          <h2>오류 발생</h2>
          <p>{error.message}</p>
          <GoToCategoriesLink />
        </div>
      );
    }
    return <div>알 수 없는 오류가 발생했습니다.</div>;
  }
}
