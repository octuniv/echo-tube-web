import Link from "next/link";

export function PaginationControls({
  currentPage,
  totalPages,
  currentLimit,
  baseUrl,
}: {
  currentPage: number;
  totalPages: number;
  currentLimit: number;
  baseUrl: string;
}) {
  const generateHref = (newPage: number) =>
    `${baseUrl}?page=${newPage}&limit=${currentLimit}`;

  return (
    <div className="flex justify-center mt-4 space-x-2">
      {Array.from({ length: totalPages }, (_, i) => (
        <Link
          key={i + 1}
          href={generateHref(i + 1)}
          className={`px-3 py-1 rounded ${
            currentPage === i + 1 ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          {i + 1}
        </Link>
      ))}
    </div>
  );
}
