// tests-e2e/util/test-utils.ts
import { expect, Cookie } from "@playwright/test";

export const expectCookiesToBeDefined = (
  cookies: Cookie[],
  cookieNames: string[]
) => {
  cookieNames.forEach((name) => {
    const cookie = cookies.find((c) => c.name === name);
    expect(cookie, `Cookie '${name}' should be defined`).toBeDefined();
  });
};

export const expectValidUserCookie = (cookies: Cookie[]) => {
  const userCookie = cookies.find((c) => c.name === "user");
  expect(userCookie, "User cookie should exist").toBeDefined();

  try {
    const userData = JSON.parse(decodeURIComponent(userCookie!.value));
    expect(userData).toHaveProperty("name");
    expect(userData).toHaveProperty("nickname");
    expect(userData).toHaveProperty("email");
    expect(userData).toHaveProperty("role");
    return userData; // 추후 검증에 사용 가능
  } catch (e) {
    throw new Error("Invalid user cookie format");
  }
};

export const expectCookiesToNotExist = (
  cookies: Cookie[],
  cookieNames: string[]
) => {
  cookieNames.forEach((name) => {
    const cookie = cookies.find((c) => c.name === name);
    expect(cookie, `Cookie '${name}' should not exist`).toBeFalsy();
  });
};
