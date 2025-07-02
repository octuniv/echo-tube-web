// components/admin/users/UserSearchForm.tsx
"use client";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { SearchUserDtoSchema } from "@/lib/definition/adminUserManagementSchema";

export default function UserSearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    email: "",
    nickname: "",
    role: "",
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  // Initialize form with existing search params
  useEffect(() => {
    const email = searchParams.get("searchEmail") || "";
    const nickname = searchParams.get("searchNickname") || "";
    const role = searchParams.get("searchRole") || "";

    setFormData({
      email,
      nickname,
      role,
    });
  }, [searchParams]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input
    const validationData = {
      searchEmail: formData.email || undefined,
      searchNickname: formData.nickname || undefined,
      searchRole: formData.role || undefined,
      page: 1,
      limit: Number(searchParams.get("limit") || "10"),
      sort: searchParams.get("sort") || "createdAt",
      order: searchParams.get("order") || "DESC",
    };

    const result = SearchUserDtoSchema.safeParse(validationData);

    if (!result.success) {
      const fieldErrors: Record<string, string[]> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0] in fieldErrors) {
          fieldErrors[issue.path[0]].push(issue.message);
        } else {
          fieldErrors[issue.path[0]] = [issue.message];
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});

    // Build new search params
    const newParams = new URLSearchParams();

    if (formData.email) newParams.set("searchEmail", formData.email);
    if (formData.nickname) newParams.set("searchNickname", formData.nickname);
    if (formData.role) newParams.set("searchRole", formData.role);

    // Preserve pagination and sorting parameters
    ["page", "limit", "sort", "order"].forEach((param) => {
      const value = searchParams.get(param);
      if (value) newParams.set(param, value);
    });

    router.push(`/admin/users?${newParams.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="mb-6 bg-gray-50 p-4 rounded-lg">
      {/* Form fields with error messages */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            이메일
          </label>
          <input
            type="text"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
          {errors.searchEmail && (
            <p className="mt-1 text-sm text-red-500">
              {errors.searchEmail.join(", ")}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            닉네임
          </label>
          <input
            type="text"
            name="nickname"
            value={formData.nickname}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
          {errors.searchNickname && (
            <p className="mt-1 text-sm text-red-500">
              {errors.searchNickname.join(", ")}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            역할
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">전체</option>
            <option value="admin">관리자</option>
            <option value="user">일반 사용자</option>
            <option value="bot">봇</option>
          </select>
          {errors.searchRole && (
            <p className="mt-1 text-sm text-red-500">
              {errors.searchRole.join(", ")}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          검색
        </button>
      </div>
    </form>
  );
}
