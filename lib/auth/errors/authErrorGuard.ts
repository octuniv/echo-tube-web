import { ERROR_MESSAGES } from "../../../lib/constants/errorMessage";
import { AuthenticatedFetchError, AuthenticatedFetchErrorType } from "../types";

export function authErrorGuard(error: AuthenticatedFetchError) {
  if (
    error.type === AuthenticatedFetchErrorType.Unauthorized ||
    error.type === AuthenticatedFetchErrorType.Forbidden
  ) {
    throw new Error(ERROR_MESSAGES.FORBIDDEN);
  }
}
