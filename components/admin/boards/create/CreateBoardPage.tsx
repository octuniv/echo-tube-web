"use client";

import { useActionState } from "react";
import { createBoard } from "@/lib/action/adminBoardManagementApi";
import { BoardFormState } from "@/lib/definition/admin/adminBoardManagementSchema";
import { AvailableCategoriesResponse } from "@/lib/definition/admin/adminCategoryManagementSchema";
import BoardForm from "../BoardForm";

interface PageProps {
  categories: AvailableCategoriesResponse;
}
const CreateBoardPage: React.FC<PageProps> = ({ categories }) => {
  const initialState: BoardFormState = { message: "", errors: {} };
  const [state, formAction] = useActionState(createBoard, initialState);
  return (
    <BoardForm state={state} formAction={formAction} categories={categories} />
  );
};

export default CreateBoardPage;
