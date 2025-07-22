import DeleteButton from "@/components/admin/users/buttons/DeleteButton";
import DetailButton from "@/components/admin/users/buttons/DetailButton";
import EditButton from "@/components/admin/users/buttons/EditButton";
import LimitSelector from "@/components/admin/users/LimitSelector";
import SortControls from "@/components/admin/users/SortControls";
import UserSearchForm from "@/components/admin/users/UserSearchForm";
import UnauthorizedRedirect from "@/components/UnauthorizedRedirect";
import {
  FetchUserPaginatedList,
  FetchUserSearchResults,
} from "@/lib/action/adminUserManagementApi";
import { ERROR_MESSAGES } from "@/lib/constants/errorMessage";
import {
  AdminUserListPaginatedResponse,
  SearchUserDtoSchema,
} from "@/lib/definition/adminUserManagementSchema";
import Link from "next/link";

export default async function UserList({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    sort?: "createdAt" | "updatedAt";
    order?: "ASC" | "DESC";
    searchEmail?: string;
    searchNickname?: string;
    searchRole?: string;
  }>;
}) {
  const params = await searchParams;

  // Validate and parse search parameters
  const validatedSearchParams = SearchUserDtoSchema.safeParse({
    ...params,
    page: Number(params.page) || 1,
    limit: Number(params.limit) || 10,
  });

  let data: AdminUserListPaginatedResponse;
  let searchMode = false;
  let currentPage: number;
  let currentLimit: number;

  try {
    if (validatedSearchParams.success) {
      currentPage = validatedSearchParams.data.page;
      currentLimit = validatedSearchParams.data.limit;
      const { searchEmail, searchNickname, searchRole } =
        validatedSearchParams.data;
      searchMode = !!(searchEmail || searchNickname || searchRole);

      if (searchMode) {
        data = await FetchUserSearchResults(validatedSearchParams.data);
      } else {
        data = await FetchUserPaginatedList({
          page: validatedSearchParams.data.page,
          limit: validatedSearchParams.data.limit,
          sort: validatedSearchParams.data.sort,
          order: validatedSearchParams.data.order,
        });
      }
    } else {
      // Handle invalid search parameters
      currentPage = 1;
      currentLimit = 10;
      data = await FetchUserPaginatedList({
        page: 1,
        limit: 10,
      });
      searchMode = false;
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.startsWith("Invalid data format")) {
        return (
          <div className="text-red-500 p-4">
            데이터 형식이 올바르지 않습니다.
          </div>
        );
      } else if (error.message === ERROR_MESSAGES.FORBIDDEN) {
        return <UnauthorizedRedirect />;
      }
      return <div className="text-red-500 p-4">{error.message}</div>;
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

      <UserSearchForm />
      <SortControls />

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b bg-gray-100">
            <th className="p-2 text-left">ID</th>
            <th className="p-2 text-left">이름</th>
            <th className="p-2 text-left">닉네임</th>
            <th className="p-2 text-left">이메일</th>
            <th className="p-2 text-left">역할</th>
            <th className="p-2 text-left">상태</th>
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
              <td className="p-2">
                {user.deletedAt ? (
                  <span className="inline-block px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded">
                    삭제됨
                  </span>
                ) : (
                  <span className="inline-block px-2 py-1 text-xs font-semibold text-white bg-green-500 rounded">
                    활성
                  </span>
                )}
              </td>

              <td className="p-2 flex space-x-2">
                <DetailButton href={`/admin/users/${user.id}`} />
                {!user.deletedAt && (
                  <>
                    <EditButton href={`/admin/users/edit/${user.id}`} />
                    <DeleteButton
                      userId={user.id}
                      userNickname={user.nickname}
                    />
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 flex justify-end">
        <Link
          href="/admin/users/create"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          + 새로운 사용자 생성
        </Link>
      </div>

      <div className="flex justify-between items-center mt-4 mb-2">
        <div className="text-sm text-gray-600">
          현재 페이지: <span className="font-medium">{currentPage}</span> /{" "}
          {data.totalPages}
        </div>

        <LimitSelector currentLimit={currentLimit} />
      </div>
      <PaginationControls
        currentPage={data.currentPage}
        totalPages={data.totalPages}
        currentLimit={currentLimit}
      />
    </div>
  );
}

function PaginationControls({
  currentPage,
  totalPages,
  currentLimit,
}: {
  currentPage: number;
  totalPages: number;
  currentLimit: number;
}) {
  const generateHref = (newPage: number) =>
    `/admin/users?page=${newPage}&limit=${currentLimit}`;

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
