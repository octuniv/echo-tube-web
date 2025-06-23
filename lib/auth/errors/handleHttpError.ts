// errors/handleHttpError.ts
import { AuthenticatedFetchError, AuthenticatedFetchErrorType } from "../types";

export async function handleHttpError(
  response: Response
): Promise<AuthenticatedFetchError> {
  const status = response.status;

  let body;
  try {
    body = await response.json();
  } catch {
    body = await response.text();
  }

  switch (status) {
    case 401:
      return {
        type: AuthenticatedFetchErrorType.Unauthorized,
        message: ERROR_MESSAGES.UNAUTHORIZED,
        status,
      };

    case 404:
      return {
        type: AuthenticatedFetchErrorType.NotFound,
        message: ERROR_MESSAGES.NOT_FOUND,
        status,
      };

    case 409:
      return {
        type: AuthenticatedFetchErrorType.ConflictError,
        message:
          typeof body === "string"
            ? body
            : body.message || ERROR_MESSAGES.CONFLICT,
        status,
      };

    case 500:
      return {
        type: AuthenticatedFetchErrorType.ServerError,
        message: ERROR_MESSAGES.SERVER_ERROR,
        status,
      };

    default:
      return {
        type: AuthenticatedFetchErrorType.Unknown,
        message: `알 수 없는 오류 (${status})`,
        status,
      };
  }
}

export const ERROR_MESSAGES = {
  NOT_FOUND: "요청한 리소스를 찾을 수 없습니다.",
  UNAUTHORIZED: "인증이 필요합니다.",
  CONFLICT: "요청한 값이 중복되었습니다.",
  SERVER_ERROR: "서버 오류가 발생했습니다.",
};
