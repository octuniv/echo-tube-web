"use client";

import { useRouter } from "next/navigation";

export default function LimitSelector({
  currentLimit,
  baseUrl,
}: {
  currentLimit: number;
  baseUrl: string;
}) {
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = e.target.value;
    const url = `${baseUrl}?page=1&limit=${newLimit}`;
    router.push(url);
  };

  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="limit-select" className="text-sm">
        페이지당 항목 수:
      </label>
      <select
        id="limit-select"
        className="border rounded px-2 py-1 text-sm"
        defaultValue={currentLimit}
        onChange={handleChange}
      >
        <option value="5">5</option>
        <option value="10">10</option>
        <option value="20">20</option>
      </select>
    </div>
  );
}
