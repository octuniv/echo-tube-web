import Link from "next/link";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  currentLimit?: number;
  baseUrl: string;
  ariaLabel: string;
}

export function PaginationControls({
  currentPage,
  totalPages,
  currentLimit,
  baseUrl,
  ariaLabel,
}: PaginationControlsProps) {
  const generateHref = (newPage: number) => {
    if (currentLimit !== undefined && currentLimit !== null) {
      return `${baseUrl}?page=${newPage}&limit=${currentLimit}`;
    }
    return `${baseUrl}?page=${newPage}`;
  };

  return (
    <div
      className="flex justify-center mt-4 space-x-2"
      role="navigation"
      aria-label={`${ariaLabel} 페이지 네비게이션`}
      data-testid={`pagination-container-${ariaLabel
        .toLowerCase()
        .replace(/\s+/g, "-")}`}
    >
      {Array.from({ length: totalPages }, (_, i) => (
        <Link
          key={i + 1}
          href={generateHref(i + 1)}
          className={`px-3 py-1 rounded ${
            currentPage === i + 1 ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
          aria-label={`${ariaLabel} ${i + 1}페이지로 이동`}
          data-testid={`pagination-${ariaLabel
            .toLowerCase()
            .replace(/\s+/g, "-")}-page-${i + 1}`}
        >
          {i + 1}
        </Link>
      ))}
    </div>
  );
}
