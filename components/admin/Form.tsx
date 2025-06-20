export function Form({
  action,
  method,
  children,
}: {
  action: string;
  method: "POST" | "PUT";
  children: React.ReactNode;
}) {
  return (
    <form action={action} method={method} className="space-y-4">
      {children}
    </form>
  );
}
