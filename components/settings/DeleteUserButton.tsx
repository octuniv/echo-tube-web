"use client";
import { DeleteUser } from "@/lib/actions";
import { TrashIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

export default function DefaultUserButton() {
  const [errorMessage, setErrorMessage] = useState("");

  const handleDeleteAccount = async () => {
    if (
      confirm("정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")
    ) {
      try {
        await DeleteUser();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        setErrorMessage("회원탈퇴에 실패했습니다. 다시 시도해주세요.");
      }
    }
  };

  return (
    <>
      <div className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
        <button
          onClick={handleDeleteAccount}
          aria-label="DeleteUserButton"
          className="flex justify-between items-center w-full text-left"
        >
          <div>
            <h3 className="text-lg font-medium text-red-500">회원탈퇴</h3>
            <p className="text-sm text-gray-500">
              계정을 영구적으로 삭제합니다
            </p>
          </div>
          <TrashIcon className="w-6 h-6 text-red-500" />
        </button>
        {errorMessage && (
          <div className="p-4 mb-4 text-red-700 bg-red-100 rounded">
            {errorMessage}
          </div>
        )}
      </div>
    </>
  );
}
