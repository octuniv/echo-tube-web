"use client";
import { ErrorText } from "@/components/common";
import { PasswordUpdateState as ErrorState } from "@/lib/definition/userProfileSchemas";

interface ChangePasswordFormProps {
  state: ErrorState;
  formAction: (payload: FormData) => void;
}

export default function ChangePasswordForm({
  state,
  formAction,
}: ChangePasswordFormProps) {
  return (
    <form action={formAction} className="p-6">
      <h2 className="text-xl font-bold mb-4">비밀번호 변경</h2>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">비밀번호 입력</label>
        <input
          type="password"
          name="password"
          id="password"
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>
      <ErrorText elemName="password" errors={state?.errors?.password} />
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">비밀번호 확인</label>
        <input
          type="password"
          name="confirmPassword"
          id="confirmPassword"
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>
      <ErrorText
        elemName="confirmPassword"
        errors={state?.errors?.confirmPassword}
      />
      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        변경 저장
      </button>
      {state?.message && <p className="text-red-500 mt-2">{state.message}</p>}
    </form>
  );
}
