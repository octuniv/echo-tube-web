"use client";
import { ErrorText } from "@/components/common";
import { NicknameUpdateState as ErrorState } from "@/lib/definition/userProfileSchemas";

interface ChangeNicknameFormProps {
  state: ErrorState;
  formAction: (payload: FormData) => void;
}
export default function ChangeNicknameForm({
  state,
  formAction,
}: ChangeNicknameFormProps) {
  return (
    <form action={formAction} className="p-6">
      <h2 className="text-xl font-bold mb-4">닉네임 변경</h2>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">새 닉네임</label>
        <input
          type="text"
          name="nickname"
          id="nickname"
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>
      <ErrorText elemName="nickname" errors={state?.errors?.nickname} />
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
