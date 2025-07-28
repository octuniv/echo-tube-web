export type AuthenticatedFetchOptions = RequestInit & {
  url: string;
  revalidatePath?: string;
};

export enum AuthenticatedFetchErrorType {
  BadRequest = "BadRequest",
  Forbidden = "Forbidden",
  NetworkError = "NetworkError",
  ServerError = "ServerError",
  ConflictError = "ConflictError",
  Unauthorized = "Unauthorized",
  NotFound = "NotFound",
  Unknown = "Unknown",
}

export type AuthenticatedFetchError = {
  type: AuthenticatedFetchErrorType;
  message: string;
  fieldErrors?: Record<string, string[]>;
  status?: number;
};

export type AuthenticatedFetchResult<T> = {
  data: T | null;
  error: AuthenticatedFetchError | null;
};
