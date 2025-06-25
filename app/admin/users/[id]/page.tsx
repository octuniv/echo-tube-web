import Link from "next/link";
import { fetchUserDetails } from "@/lib/actions";
import { AdminUserDetailResponse } from "@/lib/definition";
import EditButton from "@/components/admin/users/buttons/EditButton";
import DeleteButton from "@/components/admin/users/buttons/DeleteButton";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = Number((await params).id);

  let userData: AdminUserDetailResponse;
  try {
    userData = await fetchUserDetails(id);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "사용자를 찾을 수 없습니다") {
        return (
          <div className="p-4 text-red-500">사용자를 찾을 수 없습니다.</div>
        );
      }
      return (
        <div className="p-4 text-red-500">
          사용자 정보를 불러오지 못했습니다
        </div>
      );
    }
    return (
      <div className="p-4 text-red-500">알 수 없는 오류가 발생했습니다</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">사용자 상세 정보</h1>
        {!userData.deletedAt && (
          <div className="flex space-x-2">
            <EditButton href={`/admin/users/edit/${id}`} />
            <DeleteButton userId={id} userNickname={userData.nickname} />
          </div>
        )}
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">기본 정보</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-500">ID</label>
                  <p className="mt-1">{userData.id}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-500">이름</label>
                  <p className="mt-1">{userData.name}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-500">닉네임</label>
                  <p className="mt-1">{userData.nickname}</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4">추가 정보</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-500">이메일</label>
                  <p className="mt-1">{userData.email}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-500">역할</label>
                  <p className="mt-1 capitalize">{userData.role}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-500">상태</label>
                  <div className="mt-1">
                    {userData.deletedAt ? (
                      <span className="inline-block px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded">
                        삭제됨
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-1 text-xs font-semibold text-white bg-green-500 rounded">
                        활성
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <h2 className="text-lg font-semibold mb-4">날짜 정보</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-500">생성일</label>
                  <p className="mt-1">
                    {new Date(userData.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-gray-500">
                    최종 수정일
                  </label>
                  <p className="mt-1">
                    {userData.updatedAt
                      ? new Date(userData.updatedAt).toLocaleString()
                      : "-"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-gray-500">삭제일</label>
                  <p className="mt-1">
                    {userData.deletedAt
                      ? new Date(userData.deletedAt).toLocaleString()
                      : "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Link
          href="/admin/users"
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          목록으로
        </Link>
      </div>
    </div>
  );
}
