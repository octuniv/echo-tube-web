import { ERROR_MESSAGES } from "../../constants/errorMessage";
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

  // 공통 메시지 추출 로직
  const getErrorMessage = (defaultMessage: string) => {
    if (typeof body === "string") return body;
    return body?.message || defaultMessage;
  };

  switch (status) {
    case 400:
      return {
        type: AuthenticatedFetchErrorType.BadRequest,
        message: getErrorMessage(ERROR_MESSAGES.BAD_REQUEST),
        status,
      };

    case 401:
      return {
        type: AuthenticatedFetchErrorType.Unauthorized,
        message: getErrorMessage(ERROR_MESSAGES.UNAUTHORIZED),
        status,
      };

    case 403:
      return {
        type: AuthenticatedFetchErrorType.Forbidden,
        message: getErrorMessage(ERROR_MESSAGES.FORBIDDEN),
        status,
      };

    case 404:
      return {
        type: AuthenticatedFetchErrorType.NotFound,
        message: getErrorMessage(ERROR_MESSAGES.NOT_FOUND),
        status,
      };

    case 409:
      return {
        type: AuthenticatedFetchErrorType.ConflictError,
        message: getErrorMessage(ERROR_MESSAGES.CONFLICT),
        status,
      };

    case 500:
      return {
        type: AuthenticatedFetchErrorType.ServerError,
        message: getErrorMessage(ERROR_MESSAGES.SERVER_ERROR),
        status,
      };

    default:
      return {
        type: AuthenticatedFetchErrorType.Unknown,
        message: getErrorMessage(`알 수 없는 오류 (${status})`),
        status,
      };
  }
}
