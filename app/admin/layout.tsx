import Link from "next/link";
import { hasAdminRole, loginStatus } from "@/lib/authState";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hasAdmin = await hasAdminRole();
  const isLogined = await loginStatus();

  // 로그인이 되지 않은 경우
  if (!(hasAdmin && isLogined)) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-800 text-white p-4">
        <nav className="space-y-2">
          <Link href="/admin/users" className="block">
            사용자 관리
          </Link>
          <Link href="/admin/categories" className="block">
            카테고리 관리
          </Link>
          <Link href="/admin/boards" className="block">
            게시판 관리
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
