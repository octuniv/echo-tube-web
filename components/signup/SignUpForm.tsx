import { UserState as ErrorState } from "@/lib/definition";
import { ErrorText, LabelInput } from "../common";

export function SignUpForm({
  state,
  formAction,
}: {
  state: ErrorState;
  formAction: (payload: FormData) => void;
}) {
  return (
    <form action={formAction}>
      <LabelInput name="name" />
      <ErrorText elemName="name" errors={state?.errors?.name} />
      <LabelInput name="email" />
      <ErrorText elemName="email" errors={state?.errors?.email} />
      <LabelInput name="password" type="password" />
      <ErrorText elemName="password" errors={state?.errors?.password} />
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 mt-2 rounded-md hover:bg-blue-700"
      >
        {"Sign Up"}
      </button>
      {state?.message && <p className="text-red-500 mt-2">{state.message}</p>}
    </form>
  );
}

export default SignUpForm;
