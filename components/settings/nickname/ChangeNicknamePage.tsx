"use client";
import { NicknameUpdateState as ErrorState } from "@/lib/definition/userProfileSchemas";
import { UpdateNicknameAction } from "@/lib/action/userProfileActions";
import ChangeNicknameForm from "./ChangeNicknameForm";
import { useActionState } from "react";

export default function ChangeNicknamePage() {
  const initialState: ErrorState = { message: "", errors: {} };
  const [state, formAction] = useActionState(
    UpdateNicknameAction,
    initialState
  );
  return <ChangeNicknameForm state={state} formAction={formAction} />;
}
