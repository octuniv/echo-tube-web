"use client"; // 클라이언트 컴포넌트 선언

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { BoardListItemDto } from "@/lib/definition";

interface AppShellProps {
  isLogined: boolean;
  children: React.ReactNode;
  boards: BoardListItemDto[];
}

const AppShell = ({ isLogined, children, boards }: AppShellProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* 사이드바 */}
      <Sidebar
        isOpen={isSidebarOpen}
        isLogined={isLogined}
        boards={boards}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1">
        {/* 헤더 */}
        <Header
          isLogined={isLogined} // 실제 로그인 상태로 교체 필요
          onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* 자식 컴포넌트 */}
        <main className="p-4 transition-all duration-300">{children}</main>
      </div>
    </div>
  );
};

export default AppShell;
