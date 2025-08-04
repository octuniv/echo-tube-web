"use client";

import Link from "next/link";
import {
  HomeIcon,
  CogIcon,
  UserGroupIcon,
  FolderIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { usePathname } from "next/navigation";
import { BoardPurpose, CategoryWithBoardsResponse } from "@/lib/definition";

interface SidebarProps {
  isOpen: boolean;
  isLogined: boolean;
  isAdmin: boolean;
  categoriesWithBoards: CategoryWithBoardsResponse;
  onClose: () => void;
}

const Sidebar = ({
  isOpen,
  isLogined,
  isAdmin,
  categoriesWithBoards,
  onClose,
}: SidebarProps) => {
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
          {isAdmin && (
            <>
              <h3 className="px-4 py-2 font-semibold text-sm text-gray-500 uppercase tracking-wider">
                관리자
              </h3>
              <div className="pl-2 space-y-1">
                <Link
                  href="/admin/users"
                  className={`flex items-center px-4 py-2 rounded-lg ${
                    pathname === "/admin/users"
                      ? "bg-blue-100 text-blue-600"
                      : "text-gray-700"
                  } hover:bg-blue-50`}
                >
                  <UserGroupIcon className="w-6 h-6 mr-3" />
                  사용자 관리
                </Link>

                <Link
                  href="/admin/categories"
                  className={`flex items-center px-4 py-2 rounded-lg ${
                    pathname === "/admin/categories"
                      ? "bg-blue-100 text-blue-600"
                      : "text-gray-700"
                  } hover:bg-blue-50`}
                >
                  <FolderIcon className="w-6 h-6 mr-3" />
                  카테고리 관리
                </Link>

                <Link
                  href="/admin/boards"
                  className={`flex items-center px-4 py-2 rounded-lg ${
                    pathname === "/admin/boards"
                      ? "bg-blue-100 text-blue-600"
                      : "text-gray-700"
                  } hover:bg-blue-50`}
                >
                  <ClipboardDocumentListIcon className="w-6 h-6 mr-3" />
                  게시판 관리
                </Link>
              </div>
            </>
          )}
        </div>

        {categoriesWithBoards.map((category) => (
          <div key={category.name} className="space-y-2">
            <h3
              className="px-4 py-2 font-semibold text-sm text-gray-500 uppercase tracking-wider"
              aria-label={`category-label-${category.name}`}
            >
              {category.name}
            </h3>
            {category.boardGroups
              .sort((a, b) =>
                a.purpose === BoardPurpose.GENERAL
                  ? -1
                  : b.purpose === BoardPurpose.GENERAL
                  ? 1
                  : 0
              )
              .map((group) => (
                <div key={group.purpose} className="pl-2">
                  {group.boards.map((board) => {
                    const href = `/boards/${board.slug}`;
                    const isActive = pathname === href;

                    return (
                      <Link
                        key={board.id}
                        href={href}
                        className={`flex items-center px-4 py-2 rounded-lg ${
                          isActive
                            ? "bg-blue-100 text-blue-600"
                            : "text-gray-700"
                        } hover:bg-blue-50`}
                        aria-label={`board-link-${board.name}-${board.slug}`}
                      >
                        <span
                          className="w-6 h-6 mr-3"
                          aria-hidden="true"
                        ></span>
                        {board.name}
                        {group.purpose === BoardPurpose.AI_DIGEST &&
                          isActive && (
                            <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              AI
                            </span>
                          )}
                      </Link>
                    );
                  })}
                </div>
              ))}
          </div>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
