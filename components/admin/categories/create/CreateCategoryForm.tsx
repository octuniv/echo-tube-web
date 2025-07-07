import {
  CreateCategoryState,
  ValidateSlugType,
} from "@/lib/definition/adminCategoryManagementSchema";
import { GoToCategoriesLink } from "../GoToCategoriesLink";
import { validateSlug } from "@/lib/action/adminCategoryManagementApi";
import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";

export default function CreateCategoryForm({
  state,
  formAction,
}: {
  state: CreateCategoryState;
  formAction: (payload: FormData) => void;
}) {
  const [slugs, setSlugs] = useState<string[]>([""]);
  const [validationResults, setValidationResults] = useState<{
    [index: number]: ValidateSlugType | undefined;
  }>({});

  const [validationLoading, setValidationLoading] = useState<{
    [index: number]: boolean;
  }>({});

  const validateSlugDebounced = useDebouncedCallback(
    async (index: number, slugValue: string) => {
      if (slugValue.trim() === "") {
        setValidationLoading((prev) => ({ ...prev, [index]: false }));
        return;
      }

      try {
        setValidationLoading((prev) => ({ ...prev, [index]: true }));
        const result = await validateSlug(slugValue);
        setValidationResults((prev) => ({ ...prev, [index]: result }));
      } catch (error) {
        console.error("Slug validation failed:", error);
      } finally {
        setValidationLoading((prev) => ({ ...prev, [index]: false }));
      }
    },
    300
  );

  const handleSlugChange = (index: number, value: string) => {
    const updatedSlugs = [...slugs];
    updatedSlugs[index] = value;
    setSlugs(updatedSlugs);

    setValidationResults((prev) => ({ ...prev, [index]: undefined }));
    setValidationLoading((prev) => ({ ...prev, [index]: true }));

    validateSlugDebounced(index, value);
  };

  const addSlugField = () => {
    setSlugs([...slugs, ""]);
  };

  const removeSlugField = (index: number) => {
    const updatedSlugs = slugs.filter((_, i) => i !== index);
    setSlugs(updatedSlugs);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        새로운 카테고리 생성
      </h1>

      <div className="mt-4">
        <GoToCategoriesLink />
      </div>

      {state?.message && (
        <p className="mt-4 text-red-500 text-center">{state.message}</p>
      )}

      <form action={formAction} className="space-y-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            카테고리 이름
          </label>
          <input
            type="text"
            id="name"
            name="name"
            className={`mt-1 block w-full px-4 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
              state.errors?.name ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="예: 공지사항"
          />
          {state.errors?.name && (
            <p className="mt-1 text-sm text-red-600">{state.errors.name[0]}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            이름은 숫자나 특수문자를 포함할 수 없습니다.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            허용 슬러그
          </label>
          <p className="mt-1 text-sm text-gray-500">
            이 카테고리에 연결할 슬러그를 입력하세요. 최소 1개 이상 필요합니다.
          </p>
          <div className="mt-2 space-y-2">
            {slugs.map((slug, index) => (
              <div key={index} className="flex flex-col">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    name="allowedSlugs"
                    value={slug}
                    onChange={(e) => handleSlugChange(index, e.target.value)}
                    className={`block w-full px-4 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                      state.errors?.allowedSlugs
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="예: notice"
                  />
                  {slugs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSlugField(index)}
                      className="px-2 py-2 text-red-600 hover:text-red-800"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {validationLoading[index] && (
                  <p className="mt-1 text-sm text-gray-500">검증 중...</p>
                )}

                {!validationLoading[index] &&
                  validationResults[index] !== undefined && (
                    <p
                      className={`mt-1 text-sm ${
                        validationResults[index]?.isUsed
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {validationResults[index]?.isUsed
                        ? "이미 사용 중인 슬러그입니다."
                        : "사용 가능한 슬러그입니다."}
                    </p>
                  )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addSlugField}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            + 슬러그 추가
          </button>
          {state.errors?.allowedSlugs && (
            <p className="mt-1 text-sm text-red-600">
              {state.errors.allowedSlugs[0]}
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
          >
            생성
          </button>
        </div>
      </form>
    </div>
  );
}
