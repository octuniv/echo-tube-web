"use client";
import Link from "next/link";
import { PencilIcon } from "@heroicons/react/24/outline";
import DeleteUserButton from "./DeleteUserButton";

export default function SettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">설정</h1>

      {/* 닉네임 변경 카드 */}
      <Link href="/settings/nickname" className="block mb-4">
        <div className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">닉네임 변경</h3>
              <p className="text-sm text-gray-500">사용자 이름을 수정합니다</p>
            </div>
            <PencilIcon className="w-6 h-6 text-gray-400" />
          </div>
        </div>
      </Link>

      {/* 비밀번호 변경 카드 */}
      <Link href="/settings/password" className="block mb-4">
        <div className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">비밀번호 변경</h3>
              <p className="text-sm text-gray-500">계정 보안을 강화합니다</p>
            </div>
            <PencilIcon className="w-6 h-6 text-gray-400" />
          </div>
        </div>
      </Link>

      {/* 회원탈퇴 카드 */}
      <DeleteUserButton />
    </div>
  );
}
