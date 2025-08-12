"use client";
import {
  BoardFormState,
  BoardFormData,
} from "@/lib/definition/admin/adminBoardManagementSchema";
import {
  AvailableCategoriesResponse,
  AvailableCategorySlug,
} from "@/lib/definition/admin/adminCategoryManagementSchema";
import { UserRole, BoardPurpose } from "@/lib/definition/enums";
import { useEffect, useState } from "react";

interface FormProps {
  state: BoardFormState;
  formAction: (payload: FormData) => void;
  categories: AvailableCategoriesResponse;
  initialData?: BoardFormData;
}

export default function BoardForm({
  state,
  formAction,
  categories,
  initialData,
}: FormProps) {
  // State for selected category and available slugs
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    number | undefined
  >(initialData?.categoryId);
  const [availableSlugs, setAvailableSlugs] = useState<AvailableCategorySlug[]>(
    []
  );

  // Update available slugs when selected category changes
  useEffect(() => {
    if (!selectedCategoryId) {
      setAvailableSlugs([]);
      return;
    }

    const selectedCategory = categories.find(
      (category) => category.id === selectedCategoryId
    );

    if (selectedCategory) {
      setAvailableSlugs(selectedCategory.availableSlugs);
    } else {
      setAvailableSlugs([]);
    }
  }, [selectedCategoryId, categories]);

  return (
    <form action={formAction} className="space-y-6">
      {/* 카테고리 */}
      <div>
        <label htmlFor="categoryId" className="block text-sm font-medium">
          카테고리
        </label>
        <select
          id="categoryId"
          name="categoryId"
          value={selectedCategoryId ?? ""}
          onChange={(e) =>
            setSelectedCategoryId(
              e.target.value ? Number(e.target.value) : undefined
            )
          }
          className="mt-1 block w-full rounded-md border p-2"
          aria-invalid={state.errors?.categoryId ? "true" : "false"}
          disabled={categories.length === 0 && !initialData}
        >
          {categories.length === 0 && !initialData ? (
            <option value="">카테고리 없음</option>
          ) : (
            <>
              <option value="">카테고리 선택</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </>
          )}
        </select>
        {state.errors?.categoryId && (
          <p className="mt-1 text-sm text-red-600">
            {state.errors.categoryId[0]}
          </p>
        )}
      </div>

      {/* Slug Select */}
      <div>
        <label htmlFor="slug" className="block text-sm font-medium">
          슬러그 (URL 경로)
        </label>
        <select
          id="slug"
          name="slug"
          key={availableSlugs.map((s) => s.slug).join(",")}
          defaultValue={initialData?.slug ?? ""}
          className="mt-1 block w-full rounded-md border p-2"
          aria-invalid={state.errors?.slug ? "true" : "false"}
          disabled={!selectedCategoryId || availableSlugs.length === 0}
        >
          {!selectedCategoryId || availableSlugs.length === 0 ? (
            <option value="">카테고리를 선택하세요</option>
          ) : (
            <>
              <option value="">슬러그 선택</option>
              {availableSlugs.map((slugObj) => (
                <option key={slugObj.slug} value={slugObj.slug}>
                  {slugObj.slug}
                </option>
              ))}
            </>
          )}
        </select>
        {state.errors?.slug && (
          <p className="mt-1 text-sm text-red-600">{state.errors.slug[0]}</p>
        )}
      </div>

      {/* 이름 */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          게시판 이름
        </label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={initialData?.name ?? ""}
          className="mt-1 block w-full rounded-md border p-2"
          aria-invalid={state.errors?.name ? "true" : "false"}
        />
        {state.errors?.name && (
          <p className="mt-1 text-sm text-red-600">{state.errors.name[0]}</p>
        )}
      </div>

      {/* 설명 */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium">
          설명 (선택)
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={initialData?.description ?? ""}
          className="mt-1 block w-full rounded-md border p-2"
          rows={3}
        />
      </div>

      {/* 권한 */}
      <div>
        <label htmlFor="requiredRole" className="block text-sm font-medium">
          필요한 역할
        </label>
        <select
          id="requiredRole"
          name="requiredRole"
          defaultValue={initialData?.requiredRole ?? "USER"}
          className="mt-1 block w-full rounded-md border p-2"
          aria-invalid={state.errors?.requiredRole ? "true" : "false"}
        >
          {Object.values(UserRole).map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        {state.errors?.requiredRole && (
          <p className="mt-1 text-sm text-red-600">
            {state.errors.requiredRole[0]}
          </p>
        )}
      </div>

      {/* 타입 */}
      <div>
        <label htmlFor="type" className="block text-sm font-medium">
          게시판 타입
        </label>
        <select
          id="type"
          name="type"
          defaultValue={initialData?.type ?? "GENERAL"}
          className="mt-1 block w-full rounded-md border p-2"
          aria-invalid={state.errors?.type ? "true" : "false"}
        >
          {Object.values(BoardPurpose).map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        {state.errors?.type && (
          <p className="mt-1 text-sm text-red-600">{state.errors.type[0]}</p>
        )}
      </div>

      {/* 상태 메시지 */}
      {state.message && (
        <div className="text-sm text-red-600">{state.message}</div>
      )}

      <button
        type="submit"
        className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        적용
      </button>
    </form>
  );
}
