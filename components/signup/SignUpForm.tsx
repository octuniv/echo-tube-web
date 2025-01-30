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
    <form
      action={formAction}
      className="max-w-md mx-auto mt-10 p-6 bg-white shadow-md rounded"
    >
      <h1 className="text-2xl font-bold mb-4 text-center">Sign Up</h1>
      <LabelInput name="name" />
      <ErrorText elemName="name" errors={state?.errors?.name} />
      <LabelInput name="email" />
      <ErrorText elemName="email" errors={state?.errors?.email} />
      <LabelInput name="password" type="password" />
      <ErrorText elemName="password" errors={state?.errors?.password} />
      <button
        type="submit"
        className="w-full bg-blue-500 text-white my-2 py-2 rounded hover:bg-blue-600 transition"
      >
        {"Sign Up"}
      </button>
      {state?.message && <p className="text-red-500 mt-2">{state.message}</p>}
    </form>
  );
}

export default SignUpForm;
