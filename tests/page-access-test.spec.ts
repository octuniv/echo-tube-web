import { test, expect } from "@playwright/test";

test("Main Page Access test", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("paragraph")).toContainText("Welcome My Home!");
});

test("Login Page Access Test", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Login" }).click();
  await expect(page).toHaveURL("/login");
  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
  await expect(page.getByText("Email")).toBeVisible();
  await expect(page.getByText("Password")).toBeVisible();
  await page.getByRole("link", { name: "MyApp" }).click();
  await expect(page).not.toHaveURL("/login");
});

test("Dashboard Page Can't Access Test (if you don't login)", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL("/login");
});
