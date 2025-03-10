"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ChangeNicknameForm() {
  const [nickname, setNickname] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // API 호출 로직 추가
    alert("닉네임 변경 기능 구현 필요");
    router.back();
  };

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <h2 className="text-xl font-bold mb-4">닉네임 변경</h2>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">새 닉네임</label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
          required
        />
      </div>
      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        변경 저장
      </button>
    </form>
  );
}
