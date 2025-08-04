// components/Boards/Shared/BoardHeader.tsx
export default function BoardHeader({
  name,
  description,
}: {
  name: string;
  description?: string | null;
}) {
  return (
    <div className="mb-6 border-b pb-4">
      <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
      {description && (
        <p className="text-gray-600 mt-2 line-clamp-2">{description}</p>
      )}
    </div>
  );
}
