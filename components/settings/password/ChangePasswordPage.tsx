"use client";

import { PasswordUpdateState as ErrorState } from "@/lib/definition/userProfileSchemas";
import { UpdatePasswordAction } from "@/lib/action/userProfileActions";
import ChangePasswordForm from "./ChangePasswordForm";
import { useActionState } from "react";

export function ChangePasswordPage() {
  const initialState: ErrorState = { message: "", errors: {} };
  const [state, formAction] = useActionState(
    UpdatePasswordAction,
    initialState
  );
  return <ChangePasswordForm state={state} formAction={formAction} />;
}
