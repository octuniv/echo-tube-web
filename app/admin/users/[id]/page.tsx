import AdminUserEditPage from "@/components/admin/users/edit/AdminUserEditPage";
import { fetchUserDetails } from "@/lib/actions";
import { AdminUserDetailResponse } from "@/lib/definition";
import { notFound } from "next/navigation";

interface pageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function UserDetail({ params }: pageProps) {
  const { id } = await params;
  const userId = Number(id);
  let userData: AdminUserDetailResponse;

  if (isNaN(userId)) {
    notFound();
  }

  try {
    userData = await fetchUserDetails(userId);
  } catch {
    notFound();
  }
  return <AdminUserEditPage userId={userId} userData={userData} />;
}
