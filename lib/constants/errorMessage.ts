export const ERROR_MESSAGES = {
  NICKNAME_EXISTS: "This nickname currently exists.",
  EMAIL_EXISTS: "This email currently exists.",
  NAME_EXISTS: "This name currently exists.",
  INVALID_CREDENTIALS: "Invalid credentials",
  SERVER_ERROR: "Server error occurred",
  UNAUTHORIZED: "Session expired",
  INVALID_FIELD: "Invalid field value.",
  CONFLICT: "The requested value is duplicated.",
  NOT_FOUND: "The requested resource could not be found.",
  BAD_REQUEST: "Invalid request.",
  DUPLICATE_VALUES: (values: string[]) =>
    `이미 사용 중인 값이 있습니다: ${values.join(", ")}`,
  MISSING_VALUE: "요청에 필요한 값이 존재하지 않습니다.",
  UNKNOWN_ERROR: "알수 없는 에러",
  INVALID_DATA_TYPE: "유효하지 않은 데이터가 불려왔습니다.",
  FORBIDDEN: "허락되지 않은 접근입니다.",
} as const;
