"use client"; // 클라이언트 컴포넌트

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <h1 className="text-4xl font-bold text-red-500">Something went wrong!</h1>
      <p className="mt-4 text-gray-600">{error.message}</p>
      <button
        onClick={() => reset()}
        className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Try again
      </button>
    </div>
  );
}
