export const BOARD_ERROR_MESSAGES = {
  INVALID_SLUG:
    "Slug must be URL-friendly (lowercase letters, numbers, hyphens)",
  NOT_FOUND_BOARD: "Board not found",
  SLUG_NOT_ALLOWED_IN_CATEGORY: (slug: string) =>
    `Slug "${slug}" is not allowed in this category`,
  DUPLICATE_SLUG: (slug: string) => `Slug "${slug}" is already in use`,
  NOT_ALLOWED_BOARD_TYPE: "AI_DIGEST board requires a role higher than USER",
  FAIL_FETCH_BOARD: "보드 목록을 불러오지 못했습니다. 다시 시도해주세요",
  INVALID_FORM_DATA: "유효하지 않은 입력 값이 있습니다.",
  INVALID_ID_TYPE: "Validation failed (numeric string is expected)",
  SLUG_REQUIRED: "Slug is required",
  NAME_REQUIRED: "Name is required",
};
