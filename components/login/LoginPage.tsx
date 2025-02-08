"use client";

import { LoginAction } from "@/lib/actions";
import { useActionState } from "react";
import { LoginInfoState as ErrorState } from "@/lib/definition";
import LoginForm from "./LoginForm";

const LoginPage: React.FC = () => {
  const initialState: ErrorState = { message: "", errors: {} };
  const [state, formAction] = useActionState(LoginAction, initialState);
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <LoginForm state={state} formAction={formAction} />
    </div>
  );
};

export default LoginPage;
