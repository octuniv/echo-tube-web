export function LabelInput({
  name,
  ...rest
}: {
  name: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div key={name}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {name}
      </label>
      <input
        type="text"
        name={name}
        id={name}
        className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
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
