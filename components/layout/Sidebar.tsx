"use client";

import Link from "next/link";
import {
  HomeIcon,
  DocumentTextIcon,
  CogIcon,
  DocumentDuplicateIcon,
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

  const generalBoards = boards.filter((board) => board.boardType === "general");
  const aiDigestBoards = boards.filter(
    (board) => board.boardType === "ai_digest"
  );

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

        {generalBoards.length > 0 && (
          <div className="space-y-2">
            <h3
              className="px-4 py-2 font-semibold text-sm text-gray-500 uppercase tracking-wider"
              id="general-heading"
            >
              <span className="inline-flex items-center gap-1">
                <DocumentTextIcon className="w-4 h-4 text-gray-400" />
                일반 게시판
              </span>
            </h3>
            {generalBoards.map((board) => {
              const href = `/boards/${board.slug}`;
              const isActive = pathname === href;

              return (
                <Link
                  key={board.id}
                  href={href}
                  className={`flex items-center px-4 py-2 rounded-lg ${
                    isActive ? "bg-blue-100 text-blue-600" : "text-gray-700"
                  } hover:bg-blue-50`}
                  aria-label={`일반 게시판 - ${board.name} category`}
                >
                  <span className="w-6 h-6 mr-3" aria-hidden="true"></span>
                  {board.name}
                </Link>
              );
            })}
          </div>
        )}

        {aiDigestBoards.length > 0 && (
          <div className="space-y-2">
            <h3
              className="px-4 py-2 font-semibold text-sm text-gray-500 uppercase tracking-wider"
              id="ai-digest-heading"
            >
              <span className="inline-flex items-center gap-1">
                <DocumentDuplicateIcon className="w-4 h-4 text-blue-400" />
                AI 추천 게시판
              </span>
            </h3>
            {aiDigestBoards.map((board) => {
              const href = `/boards/ai-digest/${board.slug}`;
              const isActive = pathname === href;

              return (
                <Link
                  key={board.id}
                  href={href}
                  className={`flex items-center px-4 py-2 rounded-lg ${
                    isActive ? "bg-blue-100 text-blue-600" : "text-gray-700"
                  } hover:bg-blue-50`}
                  aria-label={`AI 큐레이션 게시판 - ${board.name} category`}
                >
                  <span className="w-6 h-6 mr-3" aria-hidden="true"></span>
                  <span>{board.name}</span>
                  {isActive && (
                    <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      AI
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </nav>
    </div>
  );
};

export default Sidebar;
