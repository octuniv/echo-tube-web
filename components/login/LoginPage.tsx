"use client";

import { LoginAction } from "@/lib/actions";
import { useActionState, useEffect, useState } from "react";
import { LoginInfoState as ErrorState } from "@/lib/definition";
import LoginForm from "./LoginForm";
import { useSearchParams } from "next/navigation";

const LoginPage: React.FC = () => {
  const initialState: ErrorState = { message: "", errors: {} };
  const [state, formAction] = useActionState(LoginAction, initialState);

  const [errorMessage, setErrorMessage] = useState("");

  const searchParams = useSearchParams();
  const query = searchParams.get("error");

  useEffect(() => {
    if (query === "session_expired") {
      setErrorMessage("세션이 만료되었습니다. 다시 로그인해주세요.");
    }
  }, [query]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      {errorMessage && (
        <div className="text-red-600 bg-red-100 p-3 rounded mb-6">
          {errorMessage}
        </div>
      )}
      <LoginForm state={state} formAction={formAction} />
    </div>
  );
};

export default LoginPage;
