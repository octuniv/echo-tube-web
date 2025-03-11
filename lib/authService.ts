import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { cookies } from "next/headers";
import { createError } from "./errors";
import { serverAddress } from "./util";

const getTokens = async (cookieStore: ReadonlyRequestCookies) => {
  const access_token = cookieStore.get("access_token")?.value;
  const refresh_token = cookieStore.get("refresh_token")?.value;
  return {
    access_token,
    refresh_token,
  };
};

const refreshToken = async (cookieStore: ReadonlyRequestCookies) => {
  const refresh_token = cookieStore.get("refresh_token")?.value;
  const InvalidJwtTokenError = createError.bind(null, "InvalidJwtToken");

  if (!refresh_token) {
    throw InvalidJwtTokenError("This token is not valid");
  }

  const refreshTokenApiAddress = serverAddress + "/auth/refresh";
  try {
    const response = await fetch(refreshTokenApiAddress, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token }),
    });

    if (!response.ok) {
      throw InvalidJwtTokenError("This token is not valid");
    }

    const { access_token: new_access_token, refresh_token: new_refresh_token } =
      await response.json();

    const baseCookieOptions = {
      httpOnly: true,
      path: "/",
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      domain: process.env.COOKIE_DOMAIN || "localhost",
    };

    cookieStore.set("access_token", new_access_token, {
      ...baseCookieOptions,
      maxAge: 60 * 15,
    });
    cookieStore.set("refresh_token", new_refresh_token, {
      ...baseCookieOptions,
      maxAge: 60 * 60 * 24 * 7,
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    throw InvalidJwtTokenError("Refreshing Token causes error.");
  }
};
interface AuthenticatedFetchOptions extends RequestInit {
  headers?: HeadersInit;
}

export async function authenticatedFetch(
  url: string,
  options: AuthenticatedFetchOptions = { headers: {} }
) {
  const { access_token: token } = await getTokens(await cookies());
  const InvalidJwtTokenError = createError.bind(null, "InvalidJwtToken");
  const ConflictedValueError = createError.bind(null, "ConflictError");

  // Send the initial request with the current token
  let response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });

  // Handle 401 Unauthorized error
  if (response.status === 401) {
    try {
      // Attempt to refresh the access token
      await refreshToken(await cookies());

      // Update the access token
      const { access_token: newToken } = await getTokens(await cookies());

      // Retry the original request with the new token
      response = await fetch(url, {
        ...options,
        headers: {
          ...(options.headers ?? {}),
          Authorization: `Bearer ${newToken}`,
        },
      });

      // If retry fails, clear auth and redirect
      if (Number(response.status) === 401) {
        throw InvalidJwtTokenError("This token is not valid");
      }

      return response;
    } catch (error) {
      // Handle refresh failure or retry failure
      throw error;
    }
  }

  if (!response.ok) {
    // Handle other HTTP errors
    if (Number(response.status) === 409) {
      const responseBody = await response.json();
      throw ConflictedValueError(responseBody.message || "Conflict occurred");
    }
    throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
  } else {
    return response;
  }
}
