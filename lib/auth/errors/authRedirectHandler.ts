"use server";

import { redirect, forbidden } from "next/navigation";
import { AuthenticatedFetchErrorType } from "../types";
import { clearAuth } from "../../authState";

export async function handleAuthRedirects(error: {
  type: AuthenticatedFetchErrorType;
  message?: string;
}) {
  switch (error.type) {
    case AuthenticatedFetchErrorType.Unauthorized:
      await clearAuth();
      redirect("/login?error=session_expired");
    case AuthenticatedFetchErrorType.Forbidden:
      forbidden();
    default:
      return;
  }
}
