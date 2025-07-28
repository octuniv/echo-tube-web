// components/admin/users/SortControls.tsx
"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";

export default function SortControls() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get("sort") || "createdAt";
  const currentOrder = searchParams.get("order") || "DESC";

  const handleSortChange = (field: "createdAt" | "updatedAt") => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("sort", field);
    router.push(`${pathname}?${newSearchParams.toString()}`);
  };

  const handleOrderChange = (order: "ASC" | "DESC") => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("order", order);
    router.push(`${pathname}?${newSearchParams.toString()}`);
  };

  return (
    <div className="flex space-x-4 mb-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          정렬 기준
        </label>
        <select
          value={currentSort}
          onChange={(e) =>
            handleSortChange(e.target.value as "createdAt" | "updatedAt")
          }
          className="border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="createdAt">생성일</option>
          <option value="updatedAt">수정일</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          정렬 방향
        </label>
        <select
          value={currentOrder}
          onChange={(e) => handleOrderChange(e.target.value as "ASC" | "DESC")}
          className="border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="ASC">오름차순</option>
          <option value="DESC">내림차순</option>
        </select>
      </div>
    </div>
  );
}
