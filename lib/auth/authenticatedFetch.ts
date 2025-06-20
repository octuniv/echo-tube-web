// utils/authenticatedFetch.ts
import { revalidatePath } from "next/cache";
import {
  AuthenticatedFetchResult,
  AuthenticatedFetchErrorType,
  AuthenticatedFetchOptions,
} from "./types";
import { getTokens } from "./tokenUtils";
import { refreshAccessToken } from "./refreshToken";
import { handleHttpError } from "./errors/handleHttpError";

export async function authenticatedFetch<T>(
  options: AuthenticatedFetchOptions
): Promise<AuthenticatedFetchResult<T>> {
  try {
    const { accessToken } = await getTokens();
    const headers = new Headers(options.headers);

    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }

    const response = await fetch(options.url, {
      ...options,
      headers,
    });

    if (response.ok) {
      if (options.revalidatePath) revalidatePath(options.revalidatePath);
      return {
        data: await response.json(),
        error: null,
      };
    }

    if (response.status === 401) {
      const refreshResult = await refreshAccessToken();

      if (refreshResult) {
        const { accessToken: newToken } = refreshResult;
        headers.set("Authorization", `Bearer ${newToken}`);

        const retryResponse = await fetch(options.url, {
          ...options,
          headers,
        });

        if (retryResponse.ok) {
          if (options.revalidatePath) revalidatePath(options.revalidatePath);
          return { data: await retryResponse.json(), error: null };
        }

        // 재요청 실패 시, 기존의 handleHttpError로 처리
        const error = await handleHttpError(retryResponse);
        return { data: null, error };
      }

      // 리프레시 실패 시에만 Unauthorized 반환
      return {
        data: null,
        error: {
          type: AuthenticatedFetchErrorType.Unauthorized,
          message: "세션이 만료되었습니다.",
        },
      };
    }

    const error = await handleHttpError(response);
    return { data: null, error };
  } catch {
    return {
      data: null,
      error: {
        type: AuthenticatedFetchErrorType.NetworkError,
        message: "네트워크 연결에 실패했습니다.",
      },
    };
  }
}
