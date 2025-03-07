"use client";

import Link from "next/link";
import LogoutButton from "../logout/LogoutButton";
import { Bars3Icon } from "@heroicons/react/24/outline";
import {
  HomeIcon,
  ArrowRightStartOnRectangleIcon,
} from "@heroicons/react/24/solid";

interface HeaderProps {
  isLogined: boolean;
  onSidebarToggle: () => void;
}

const Header = ({ isLogined, onSidebarToggle }: HeaderProps) => {
  return (
    <header className="sticky top-0 bg-white shadow-md z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* 사이드바 토글 & 홈 버튼 */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onSidebarToggle}
              className="text-gray-600 hover:text-gray-800 focus:outline-none"
              aria-label="Sidebar Activation"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            {/* 홈 버튼 */}
            <Link
              href="/"
              className="flex items-center text-blue-600"
              aria-label="Go to Home"
            >
              <HomeIcon className="w-6 h-6 mr-2" />
              <span className="hidden sm:block text-lg font-semibold">
                MyApp
              </span>
            </Link>
          </div>

          {/* 인증 버튼 그룹 */}
          <div className="flex items-center space-x-2">
            {isLogined ? (
              <LogoutButton />
            ) : (
              <Link
                href="/login"
                className="flex items-center text-blue-600 hover:bg-blue-50 rounded-full p-2"
                aria-label="Login"
              >
                <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
                <span className="ml-2 hidden md:block">Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
