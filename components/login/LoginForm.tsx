"use client";

import Link from "next/link";
import { ErrorText, LabelInput } from "../common";
import { LoginInfoState as ErrorState } from "@/lib/definition/userAuthSchemas";

function LoginForm({
  state,
  formAction,
}: {
  state: ErrorState;
  formAction: (payload: FormData) => void;
}) {
  return (
    <form
      action={formAction}
      className="max-w-md mx-auto mt-10 p-6 bg-white shadow-md rounded"
    >
      <h1 className="text-2xl font-bold mb-4 text-center">Login</h1>
      <LabelInput name="email" />
      <ErrorText elemName="email" errors={state?.errors?.email} />
      <LabelInput name="password" type="password" />
      <ErrorText elemName="password" errors={state?.errors?.password} />
      <button
        type="submit"
        className="w-full bg-blue-500 text-white my-2 py-2 rounded hover:bg-blue-600 transition"
      >
        Login
      </button>
      {state?.message && <p className="text-red-500 mt-2">{state.message}</p>}

      {/* 회원가입 링크 */}
      <div className="text-center text-sm text-gray-600 mt-4">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-blue-600 hover:underline hover:text-blue-700"
          aria-label="Signup"
        >
          Sign up here
        </Link>
      </div>
    </form>
  );
}

export default LoginForm;
