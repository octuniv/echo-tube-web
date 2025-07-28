// components/admin/users/buttons/DetailButton.tsx

import Link from "next/link";

interface DetailButtonProps {
  href: string;
}

export default function DetailButton({ href }: DetailButtonProps) {
  return (
    <Link
      href={href}
      className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors duration-200"
    >
      상세보기
    </Link>
  );
}
