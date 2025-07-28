export const CATEGORY_ERROR_MESSAGES = {
  NAME_REQUIRED: "이름은 필수입니다",
  NAME_SHOULD_BE_STRING: "이름은 문자열이여야 합니다.",
  INVALID_NAME: "이름은 숫자나 특수문자를 포함할 수 없습니다.",
  SLUG_REQUIRED: "슬러그는 필수입니다.",
  INVALID_SLUGS:
    "Each slug must be URL-friendly (lowercase letters, numbers, hyphens)",
  SLUGS_REQUIRED: "최소 1개 이상의 슬러그가 필요합니다",
  FAIL_FETCH_CATEGORY:
    "카테고리 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
  INVALID_DATA_TYPE: "유효하지 않은 데이터가 불려왔습니다.",
  DUPLICATE_CATEGORY_NAME: "이미 존재하는 카테고리 이름입니다.",
  DUPLICATE_SLUGS: (slugs?: string[]) =>
    `이미 사용 중인 슬러그가 있습니다: ${slugs ? slugs.join(", ") : ""}`,
  CATEGORY_NOT_FOUND: "카테고리를 찾을 수 없습니다.",
};
