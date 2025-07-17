"use client";

import { updateBoard } from "@/lib/action/adminBoardManagementApi";
import {
  AdminBoardResponse,
  BoardFormData,
  BoardFormState,
} from "@/lib/definition/adminBoardManagementSchema";
import { AvailableCategoriesResponse } from "@/lib/definition/adminCategoryManagementSchema";
import { useActionState } from "react";
import BoardForm from "../BoardForm";

interface PageProps {
  categories: AvailableCategoriesResponse;
  boardData: AdminBoardResponse;
}
const EditBoardPage: React.FC<PageProps> = ({ categories, boardData }) => {
  const initialState: BoardFormState = { message: "", errors: {} };
  const updateBoardWithId = updateBoard.bind(null, boardData.id);
  const [state, formAction] = useActionState(updateBoardWithId, initialState);
  const initialData: BoardFormData = {
    name: boardData.name,
    slug: boardData.slug,
    type: boardData.type,
    description: boardData.description,
    requiredRole: boardData.requiredRole,
    categoryId: boardData.categoryId,
  };
  return (
    <BoardForm
      state={state}
      formAction={formAction}
      categories={categories}
      initialData={initialData}
    />
  );
};

export default EditBoardPage;
