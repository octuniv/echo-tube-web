"use client";

import { useRouter } from "next/navigation";

export function RetryButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.refresh()}
      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
    >
      Retry
    </button>
  );
}
