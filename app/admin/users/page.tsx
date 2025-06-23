import { deleteUser, FetchUserPaginatedList } from "@/lib/actions";
import {
  AdminUserListPaginatedResponse,
  PaginationDtoSchema,
} from "@/lib/definition";
import Link from "next/link";

export default async function UserList({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string }>;
}) {
  const { page, limit } = await searchParams;

  const parsed = PaginationDtoSchema.safeParse({
    page: Number(page) || 1,
    limit: Number(limit) || 10,
  });

  const handleDeleteUser = async ({
    userId,
    userNickname,
  }: {
    userId: number;
    userNickname: string;
  }) => {
    if (confirm(`정말 ${userNickname}님을 삭제하시겠습니까?`)) {
      try {
        await deleteUser(userId);
      } catch (error) {
        let errorMessage = "알 수 없는 오류가 발생했습니다.";

        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (error && typeof error === "object" && "message" in error) {
          errorMessage =
            (error as { message?: string }).message ?? errorMessage;
        } else if (typeof error === "string") {
          errorMessage = error;
        }

        alert(errorMessage);
      }
    }
  };

  const currentPage = parsed.success ? parsed.data.page : 1;
  const currentLimit = parsed.success ? parsed.data.limit : 10;
  let data: AdminUserListPaginatedResponse;

  try {
    data = await FetchUserPaginatedList({
      page: currentPage,
      limit: currentLimit,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.startsWith("Invalid data format")) {
        return (
          <div className="text-red-500 p-4">
            데이터 형식이 올바르지 않습니다.
          </div>
        );
      } else {
        return (
          <div className="text-red-500 p-4">
            서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
          </div>
        );
      }
    }
    return (
      <div className="text-red-500 p-4">알 수 없는 오류가 발생했습니다.</div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-gray-500 p-4">
        사용자 목록을 불러오는 중입니다...
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl mb-4">사용자 목록</h1>
      <Link
        href="/admin/users/create"
        className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        + 생성
      </Link>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b bg-gray-100">
            <th className="p-2 text-left">ID</th>
            <th className="p-2 text-left">이름</th>
            <th className="p-2 text-left">닉네임</th>
            <th className="p-2 text-left">이메일</th>
            <th className="p-2 text-left">역할</th>
          </tr>
        </thead>
        <tbody>
          {data.data.map((user) => (
            <tr key={user.id} className="border-b hover:bg-gray-50">
              <td className="p-2">{user.id}</td>
              <td className="p-2">{user.name}</td>
              <td className="p-2">{user.nickname}</td>
              <td className="p-2">{user.email}</td>
              <td className="p-2">{user.role}</td>
              <td className="p-2 space-x-2">
                <Link
                  href={`/admin/users/${user.id}`}
                  className="text-blue-500 hover:underline"
                >
                  수정
                </Link>
                <button
                  onClick={() =>
                    handleDeleteUser({
                      userId: user.id,
                      userNickname: user.nickname,
                    })
                  }
                  className="text-red-500 hover:underline"
                >
                  삭제
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <PaginationControls
        currentPage={data.currentPage}
        totalPages={data.totalPages}
      />
    </div>
  );
}

function PaginationControls({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  const generateHref = (newPage: number) =>
    `/admin/users?page=${newPage}&limit=10`;

  return (
    <div className="flex justify-center mt-4 space-x-2">
      {Array.from({ length: totalPages }, (_, i) => (
        <Link
          key={i + 1}
          href={generateHref(i + 1)}
          className={`px-3 py-1 rounded ${
            currentPage === i + 1 ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          {i + 1}
        </Link>
      ))}
    </div>
  );
}
