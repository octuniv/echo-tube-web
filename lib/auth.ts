import { cookies } from "next/headers";

export async function getUserFromCookie(): Promise<{
  isAuthenticated: boolean;
}> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) return { isAuthenticated: false };

  return { isAuthenticated: true };
}
