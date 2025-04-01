"use client";

import Link from "next/link";
import {
  HomeIcon,
  DocumentTextIcon,
  CogIcon,
} from "@heroicons/react/24/outline";
import { usePathname } from "next/navigation";
import { BoardListItemDto } from "@/lib/definition";

interface SidebarProps {
  isOpen: boolean;
  isLogined: boolean;
  boards: BoardListItemDto[];
  onClose: () => void;
}

const Sidebar = ({ isOpen, isLogined, boards, onClose }: SidebarProps) => {
  const pathname = usePathname();

  return (
    <div
      className={`${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } fixed inset-y-0 left-0 w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out z-30`}
    >
      <div className="p-4 flex items-center justify-between border-b">
        <h2 className="text-lg font-semibold">Menu</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          ×
        </button>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-4">
        <div className="space-y-2">
          {isLogined && (
            <>
              <Link
                href="/dashboard"
                className={`flex items-center px-4 py-2 rounded-lg ${
                  pathname === "/dashboard"
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-700"
                } hover:bg-blue-50`}
                aria-label="dashboard"
              >
                <HomeIcon className="w-6 h-6 mr-3" />
                Dashboard
              </Link>

              <Link
                href="/settings"
                className={`flex items-center px-4 py-2 rounded-lg mt-2 ${
                  pathname?.startsWith("/settings")
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-700"
                } hover:bg-blue-50`}
                aria-label="settings"
              >
                <CogIcon className="w-6 h-6 mr-3" />
                Settings
              </Link>
            </>
          )}
        </div>

        {/* Board Links */}
        <div className="space-y-2">
          {boards.map((board) => (
            <Link
              key={board.id}
              href={`/boards/${board.slug}`}
              className={`flex items-center px-4 py-2 rounded-lg ${
                pathname === `/boards/${board.slug}`
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-700"
              } hover:bg-blue-50`}
              aria-label={`Boards section - ${board.name} category`}
            >
              <DocumentTextIcon className="w-6 h-6 mr-3" />
              {board.name}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
