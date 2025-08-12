"use client";
import AdminSignUpForm from "./AdminSignUpForm";
import { useActionState } from "react";
import { AdminUserCreateState } from "@/lib/definition/admin/adminUserManagementSchema";
import { AdminSignUpAction } from "@/lib/action/adminUserManagementApi";

const AdminSignUpPage: React.FC = () => {
  const initialState: AdminUserCreateState = { message: "", errors: {} };
  const [state, formAction] = useActionState(AdminSignUpAction, initialState);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <AdminSignUpForm state={state} formAction={formAction} />
    </div>
  );
};

export default AdminSignUpPage;
