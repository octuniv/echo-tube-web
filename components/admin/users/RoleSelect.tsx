"use client";

import { ErrorText } from "@/components/common";
import { UserRole } from "@/lib/definition/enums";

interface RoleSelectProps {
  value?: string;
  errors?: string[];
  className?: string;
  disabled?: boolean;
}

export default function RoleSelect({
  value,
  errors,
  className = "",
  disabled = false,
}: RoleSelectProps) {
  return (
    <div className="mb-4">
      <label
        htmlFor="role"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        역할 선택
      </label>
      <select
        name="role"
        id="role"
        defaultValue={value}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      >
        {Object.values(UserRole).map((role) => (
          <option key={role} value={role}>
            {role === UserRole.ADMIN
              ? "관리자"
              : role === UserRole.USER
              ? "일반 사용자"
              : "봇"}
          </option>
        ))}
      </select>
      <ErrorText elemName="role" errors={errors} />
    </div>
  );
}
