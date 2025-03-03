import { PostState as ErrorState } from "@/lib/definition";
import Link from "next/link";

interface CreatePostFormProps {
  state: ErrorState;
  formAction: (payload: FormData) => void;
}

function CreatePostForm({ state, formAction }: CreatePostFormProps) {
  return (
    <div className="max-w-md mx-auto p-4 border rounded-lg shadow-md space-y-4">
      <h1 className="text-2xl font-bold text-center">새 게시물 작성</h1>

      <form action={formAction} className="space-y-4">
        {/* 제목 입력 */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700"
          >
            제목
          </label>
          <input
            type="text"
            id="title"
            name="title"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          {state?.errors?.title && (
            <p className="text-red-500 text-sm">{state.errors.title[0]}</p>
          )}
        </div>

        {/* 내용 입력 */}
        <div>
          <label
            htmlFor="content"
            className="block text-sm font-medium text-gray-700"
          >
            내용
          </label>
          <textarea
            id="content"
            name="content"
            rows={4}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          ></textarea>
          {state?.errors?.content && (
            <p className="text-red-500 text-sm">{state.errors.content[0]}</p>
          )}
        </div>

        {/* 영상 URL 입력 (선택) */}
        <div>
          <label
            htmlFor="videoUrl"
            className="block text-sm font-medium text-gray-700"
          >
            영상 URL (선택)
          </label>
          <input
            type="url"
            id="videoUrl"
            name="videoUrl"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        {/* 에러 메시지 */}
        {state?.message && (
          <p className="text-red-500 text-sm text-center">{state.message}</p>
        )}

        <div className="flex justify-between">
          {/* 제출 버튼 */}
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            작성 완료
          </button>

          {/* 돌아가기 */}
          <Link href="/posts">
            <button className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
              돌아가기
            </button>
          </Link>
        </div>
      </form>
    </div>
  );
}

export default CreatePostForm;
