// errors/handleHttpError.ts
import { AuthenticatedFetchErrorType } from "../types";

export async function handleHttpError(
  response: Response
): Promise<{ type: AuthenticatedFetchErrorType; message: string }> {
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
        message: "인증이 필요합니다.",
      };

    case 404:
      return {
        type: AuthenticatedFetchErrorType.Unknown,
        message: "요청한 리소스를 찾을 수 없습니다.",
      };

    case 409:
      return {
        type: AuthenticatedFetchErrorType.ConflictError,
        message:
          typeof body === "string"
            ? body
            : body.message || "요청한 값이 중복되었습니다.",
      };

    case 500:
      return {
        type: AuthenticatedFetchErrorType.ServerError,
        message: "서버 오류가 발생했습니다.",
      };

    default:
      return {
        type: AuthenticatedFetchErrorType.Unknown,
        message: `알 수 없는 오류 (${status})`,
      };
  }
}
