"use client";

import { AdminUserUpdateAction } from "@/lib/action/adminUserManagementApi";
import {
  AdminUserDetailResponse,
  AdminUserUpdateState,
} from "@/lib/definition/adminUserManagementSchema";
import { useActionState } from "react";
import AdminUserEditForm from "./AdminUserEditForm";

interface pageProps {
  userId: number;
  userData: AdminUserDetailResponse;
}

const AdminUserEditPage: React.FC<pageProps> = ({ userId, userData }) => {
  const initialState: AdminUserUpdateState = { message: "", errors: {} };
  const AdminUserUpdateActionWithId = AdminUserUpdateAction.bind(null, userId);
  const [state, formAction] = useActionState(
    AdminUserUpdateActionWithId,
    initialState
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <AdminUserEditForm
        state={state}
        formAction={formAction}
        userData={userData}
      />
    </div>
  );
};

export default AdminUserEditPage;
