import ErrorMessage from "@/components/errorMessage";
import AdminUserEditPage from "@/components/admin/users/edit/AdminUserEditPage";
import UnauthorizedRedirect from "@/components/UnauthorizedRedirect";
import { fetchUserDetails } from "@/lib/action/adminUserManagementApi";
import { ERROR_MESSAGES } from "@/lib/constants/errorMessage";
import { AdminUserDetailResponse } from "@/lib/definition/adminUserManagementSchema";
import { notFound } from "next/navigation";

interface pageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function UserDetail({ params }: pageProps) {
  const { id } = await params;
  const userId = Number(id);
  let userData: AdminUserDetailResponse | null;
  let message: string = "알 수 없는 오류가 발생했습니다";

  if (isNaN(userId)) {
    notFound();
  }

  try {
    userData = await fetchUserDetails(userId);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === ERROR_MESSAGES.FORBIDDEN) {
        return <UnauthorizedRedirect />;
      } else {
        message = error.message;
      }
    }
    return <ErrorMessage message={message} />;
  }

  if (!userData) {
    notFound();
  }

  return <AdminUserEditPage userId={userId} userData={userData} />;
}
