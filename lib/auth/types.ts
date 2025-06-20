export type AuthenticatedFetchOptions = RequestInit & {
  url: string;
  revalidatePath?: string;
};

export enum AuthenticatedFetchErrorType {
  NetworkError = "NetworkError",
  ServerError = "ServerError",
  ConflictError = "ConflictError",
  Unauthorized = "Unauthorized",
  Unknown = "Unknown",
}

export type AuthenticatedFetchError = {
  type: AuthenticatedFetchErrorType;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export type AuthenticatedFetchResult<T> = {
  data: T | null;
  error: AuthenticatedFetchError | null;
};
