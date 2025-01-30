import Link from "next/link";
import LogoutButton from "./logout/LogoutButton";
import { getUserFromCookie } from "@/lib/auth";

const Header = async () => {
  const { isAuthenticated } = await getUserFromCookie();
  return (
    <header className="static top-0 left-0 w-full bg-white shadow-md z-50">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        {/* 로고 */}
        <Link href="/" className="text-xl font-bold text-gray-800">
          MyApp
        </Link>

        {/* 내비게이션 */}

        <nav className="flex space-x-6">
          {isAuthenticated ? (
            <LogoutButton />
          ) : (
            <>
              <Link
                href="/signup"
                className="text-gray-600 hover:text-blue-500 transition"
              >
                SignUp
              </Link>
              <Link
                href="/login"
                className="text-gray-600 hover:text-blue-500 transition"
              >
                Login
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
