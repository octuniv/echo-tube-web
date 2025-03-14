import { JSX } from "react";

export function LabelInput({
  name,
  className,
  ...rest
}: {
  name: string;
} & React.InputHTMLAttributes<HTMLInputElement> &
  React.RefAttributes<HTMLInputElement>) {
  return (
    <div key={name}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {name}
      </label>
      <input
        type="text"
        name={name}
        id={name}
        className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          className ?? undefined
        }`}
        {...rest}
      />
    </div>
  );
}

export function ErrorText({
  elemName,
  errors,
}: {
  elemName: string;
  errors: string[] | undefined;
}) {
  if (!errors) return null;

  return (
    <>
      {errors.map((err, ind) => (
        <div
          key={`${elemName}-${ind}`}
          id={`${elemName}-error`}
          aria-live="polite"
          aria-atomic="true"
        >
          <p className="mt-2 text-sm text-red-500" key={err}>
            {err}
          </p>
        </div>
      ))}
    </>
  );
}

export function MakeFormButton({
  action,
  ButtonShape,
}: {
  action: () => Promise<void>;
  ButtonShape: () => JSX.Element;
}) {
  return (
    <form action={action}>
      <ButtonShape />
    </form>
  );
}
