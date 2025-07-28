import Link from "next/link";

export default function Forbidden() {
  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md text-center">
      <h2 className="text-2xl font-bold text-red-600 mb-4">Forbidden</h2>
      <p className="mb-6 text-gray-700">
        You are not authorized to access this resource.
      </p>
      <Link
        href="/"
        className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Return Home
      </Link>
    </div>
  );
}
