// app/admin/unauthorized/page.tsx
export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">접근 권한이 없습니다</h1>
      <p className="mb-6 text-gray-600">
        이 페이지는 어드민 계정만 접근할 수 있습니다.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          이전 페이지로
        </button>
      </div>
    </div>
  );
}
