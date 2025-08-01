// components/ErrorMessage.tsx
import React from "react";

interface ErrorMessageProps {
  /**
   * 표시할 에러 메시지 내용
   */
  message: string;
  /**
   * 에러 박스의 제목 (선택). 기본값은 "Error".
   */
  title?: string;
  /**
   * 기본 스타일에 추가하거나 덮어쓸 수 있는 CSS 클래스 (선택).
   */
  className?: string;
}

/**
 * admin 페이지 전반에서 일관되게 에러 메시지를 표시하기 위한 표준 컴포넌트.
 */
export default function ErrorMessage({
  message,
  title = "Error",
  className = "",
}: ErrorMessageProps) {
  const baseStyles = "bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6";
  const combinedClassName = `${baseStyles} ${className}`.trim();

  return (
    <div className={combinedClassName} role="alert">
      <h3 className="text-red-800 font-medium">{title}</h3>
      <p className="text-red-700 mt-1">{message}</p>{" "}
    </div>
  );
}
