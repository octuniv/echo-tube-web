"use client";

import SignUpForm from "./SignUpForm";
import { signUpAction } from "@/lib/action/userAuthAction";
import { useActionState } from "react";
import { UserState as ErrorState } from "@/lib/definition/userAuthSchemas";

const SignUpPage: React.FC = () => {
  const initialState: ErrorState = { message: "", errors: {} };
  const [state, formAction] = useActionState(signUpAction, initialState);
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <SignUpForm state={state} formAction={formAction} />
    </div>
  );
};

export default SignUpPage;
