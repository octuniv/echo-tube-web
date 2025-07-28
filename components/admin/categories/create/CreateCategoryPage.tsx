"use client";
import { createCategory } from "@/lib/action/adminCategoryManagementApi";
import { CategoryFormState } from "@/lib/definition/adminCategoryManagementSchema";
import { useActionState } from "react";
import CategoryForm from "../CategoryForm";

const CreateCategoryPage: React.FC = () => {
  const initialState: CategoryFormState = { message: "", errors: {} };
  const [state, formAction] = useActionState(createCategory, initialState);

  return <CategoryForm state={state} formAction={formAction} />;
};

export default CreateCategoryPage;
