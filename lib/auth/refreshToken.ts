// auth/refreshToken.ts
import { getTokens, setAccessToken, setRefreshToken } from "./tokenUtils";

const API_BASE_URL = process.env.SERVER_ADDRESS;

export async function refreshAccessToken(): Promise<{
  accessToken: string;
  refreshToken: string;
} | null> {
  const { refreshToken: refresh_token } = await getTokens();
  if (!refresh_token) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.access_token && data.refresh_token) {
      await setAccessToken(data.access_token);
      await setRefreshToken(data.refresh_token);
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      };
    }

    return null;
  } catch (error) {
    console.error("Failed to refresh token:", error);
    return null;
  }
}
