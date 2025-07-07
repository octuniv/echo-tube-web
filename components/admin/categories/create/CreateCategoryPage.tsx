"use client";
import { createCategory } from "@/lib/action/adminCategoryManagementApi";
import { CreateCategoryState } from "@/lib/definition/adminCategoryManagementSchema";
import { useActionState } from "react";
import CreateCategoryForm from "./CreateCategoryForm";

const CreateCategoryPage: React.FC = () => {
  const initialState: CreateCategoryState = { message: "", errors: {} };
  const [state, formAction] = useActionState(createCategory, initialState);

  return <CreateCategoryForm state={state} formAction={formAction} />;
};

export default CreateCategoryPage;
