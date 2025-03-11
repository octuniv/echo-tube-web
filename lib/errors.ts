type ErrorType = "InvalidJwtToken" | "ConflictError";

type ErrorTypeMap = {
  ConflictError: ConflictError;
  InvalidJwtToken: InvalidJwtTokenError;
};

interface CustomError {
  type: ErrorType;
  message: string;
}

export interface ConflictError extends CustomError {
  type: "ConflictError";
}

export interface InvalidJwtTokenError extends CustomError {
  type: "InvalidJwtToken";
}

export const createError = <T extends ErrorType>(
  type: T,
  message: string
): Error & ErrorTypeMap[T] => {
  const error = new Error(message) as Error & ErrorTypeMap[T];
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
