"use client";

import { updateCategory } from "@/lib/action/adminCategoryManagementApi";
import { CategoryFormState } from "@/lib/definition/admin/adminCategoryManagementSchema";
import CategoryForm from "../CategoryForm";
import { useActionState } from "react";

interface Props {
  categoryId: number;
  categoryData: { name: string; allowedSlugs: string[] };
}

const UpdateCategoryPage: React.FC<Props> = ({
  categoryId,
  categoryData,
}: Props) => {
  const initialState: CategoryFormState = { message: "", errors: {} };
  const updateCategoryWithId = updateCategory.bind(null, categoryId);
  const [state, formAction] = useActionState(
    updateCategoryWithId,
    initialState
  );

  return (
    <CategoryForm
      state={state}
      formAction={formAction}
      initialData={categoryData}
      categoryId={categoryId}
    />
  );
};

export default UpdateCategoryPage;
