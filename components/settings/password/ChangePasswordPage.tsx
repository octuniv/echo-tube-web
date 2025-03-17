"use client";

import { PasswordUpdateState as ErrorState } from "@/lib/definition";
import { UpdatePasswordAction } from "@/lib/actions";
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
