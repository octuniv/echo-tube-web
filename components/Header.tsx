import Link from "next/link";
import LogoutButton from "./logout/LogoutButton";

interface HeaderProps {
  isLogined: boolean;
}

const Header = ({ isLogined }: HeaderProps) => {
  return (
    <header className="sticky top-0 left-0 w-full bg-white shadow-md z-50">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        {/* 로고 */}
        <Link
          href="/"
          className="text-xl font-bold text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Go to Home"
        >
          MyApp
        </Link>

        {/* 내비게이션 */}
        <nav className="flex items-center space-x-4 md:space-x-6">
          {/* Posts 버튼 (항상 표시) */}
          <Link
            href="/posts"
            className="text-gray-600 hover:text-blue-500 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Go to Posts"
          >
            Post
          </Link>

          {/* 로그인/로그아웃 및 회원가입 버튼 */}
          <div className="flex space-x-4">
            {isLogined ? (
              <LogoutButton />
            ) : (
              <>
                <Link
                  href="/signup"
                  className="text-gray-600 hover:text-blue-500 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-label="Sign Up"
                >
                  SignUp
                </Link>
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-blue-500 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-label="Login"
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
