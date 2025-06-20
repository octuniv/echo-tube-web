// auth/tokenUtils.ts
import { cookies } from "next/headers";
import { baseCookieOptions } from "../util";

export async function getTokens() {
  const cookieStore = await cookies();
  return {
    accessToken: cookieStore.get("access_token")?.value,
    refreshToken: cookieStore.get("refresh_token")?.value,
  };
}

export async function setAccessToken(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("access_token", token, {
    ...baseCookieOptions,
    maxAge: 60 * 15,
  });
}

export async function setRefreshToken(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("refresh_token", token, {
    ...baseCookieOptions,
    maxAge: 60 * 60 * 24 * 7,
  });
}
