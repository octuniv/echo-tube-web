// components/admin/users/buttons/EditButton.tsx

import Link from "next/link";

interface EditButtonProps {
  href: string;
}

export default function EditButton({ href }: EditButtonProps) {
  return (
    <Link
      href={href}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
    >
      수정
    </Link>
  );
}
