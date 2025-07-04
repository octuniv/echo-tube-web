import Link from "next/link";

export function GoToCategoriesLink() {
  return (
    <Link
      href={"/admin/categories"}
      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
    >
      Go to categories
    </Link>
  );
}
