type ErrorType = "InvalidJwtToken" | "HTTPRequest";

interface CustomError {
  type: ErrorType;
  message: string;
}

export interface InvalidJwtTokenError extends CustomError {
  type: "InvalidJwtToken";
}

export interface HttpRequestError extends CustomError {
  type: "HTTPRequest";
}

export const createError = <T extends ErrorType>(
  type: T,
  message: string
): Error & Extract<CustomError, { type: T }> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const error = new Error(message) as any;
  error.type = type;
  return error;
};

export function isCustomError(error: unknown): error is CustomError {
  return (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    typeof (error as CustomError).type === "string"
  );
}
