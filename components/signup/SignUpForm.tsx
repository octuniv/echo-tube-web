// SignUpForm.tsx
"use client";
import { useRef, useState } from "react";
import { UserState as ErrorState } from "@/lib/definition";
import { LabelInput, ErrorText } from "../common";
import { checkEmailExists, checkNicknameExists } from "@/lib/actions";

type ValidationType = "nickname" | "email";

const InputWithValidation = ({
  type,
  handleClick,
  refCallback,
  status,
  errorMessage,
}: {
  type: ValidationType;
  handleClick: (type: ValidationType) => Promise<void>;
  refCallback: (element: HTMLInputElement) => void;
  status: string;
  errorMessage: string[];
}) => (
  <div className="mb-4">
    <div className="flex items-center gap-2">
      <LabelInput name={type} ref={refCallback} className="flex-1" />
      <button
        type="button"
        onClick={() => handleClick(type)}
        className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition"
        disabled={!!status}
      >
        중복 확인
      </button>
    </div>
    {status && (
      <p
        aria-labelledby={`${type}-validation`}
        className={`mt-1 text-sm ${
          status.includes("가능") ? "text-green-500" : "text-red-500"
        }`}
      >
        {status}
      </p>
    )}
    <ErrorText elemName={type} errors={errorMessage} />
  </div>
);

export default function SignUpForm({
  state,
  formAction,
}: {
  state: ErrorState;
  formAction: (payload: FormData) => void;
}) {
  const nicknameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const [validationStatus, setValidationStatus] = useState({
    nickname: "",
    email: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleCheck = async (type: ValidationType) => {
    setIsLoading(true);
    const inputElement =
      type === "nickname" ? nicknameRef.current : emailRef.current;
    const value = inputElement?.value;

    if (!value) {
      setValidationStatus((prev) => ({ ...prev, [type]: "값을 입력해주세요" }));
    } else {
      try {
        const checkFn =
          type === "nickname" ? checkNicknameExists : checkEmailExists;
        const { exists } = await checkFn(value);
        const message = exists ? "이미 사용 중" : "사용 가능";
        setValidationStatus((prev) => ({ ...prev, [type]: message }));
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        setValidationStatus((prev) => ({ ...prev, [type]: "서버 오류 발생" }));
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <form
      action={formAction}
      className="max-w-md mx-auto p-6 bg-white shadow rounded"
      noValidate
    >
      <h1 className="text-2xl font-bold mb-6 text-center">회원가입</h1>

      <LabelInput name="name" />
      <ErrorText elemName="name" errors={state?.errors?.name} />

      <InputWithValidation
        type="nickname"
        handleClick={handleCheck}
        refCallback={(el) => (nicknameRef.current = el)}
        status={validationStatus.nickname}
        errorMessage={state?.errors?.nickname || []}
      />

      <InputWithValidation
        type="email"
        handleClick={handleCheck}
        refCallback={(el) => (emailRef.current = el)}
        status={validationStatus.email}
        errorMessage={state?.errors?.email || []}
      />

      <LabelInput name="password" type="password" className="mb-4" />
      <ErrorText elemName="password" errors={state?.errors?.password} />

      <button
        type="submit"
        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
        disabled={isLoading}
      >
        회원가입
      </button>

      {state?.message && (
        <p className="mt-4 text-red-500 text-center">{state.message}</p>
      )}
    </form>
  );
}
