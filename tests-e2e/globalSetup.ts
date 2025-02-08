import { chromium } from "@playwright/test";
import path from "path";
import * as dotenv from "dotenv";
import { User } from "@/lib/definition";

dotenv.config({ path: ".env.e2e.test" });

const authFile = path.join(__dirname, "./.auth/user.json");

const account = {
  name: process.env.tester_name as string,
  nickName: process.env.tester_nickName as string,
  email: process.env.tester_email as string,
  password: process.env.tester_password as string,
} satisfies User;

async function globalSetup() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("http://localhost:3000/signup");
  await page.fill('input[name="name"]', account.name);
  await page.fill('input[name="nickName"]', account.nickName);
  await page.fill('input[name="email"]', account.email);
  await page.fill('input[name="password"]', account.password);
  await page.click('button[type="submit"]');

  await page.goto("http://localhost:3000/login");
  await page.fill('input[name="email"]', account.email);
  await page.fill('input[name="password"]', account.password);
  await page.click('button[type="submit"]');

  await page.waitForURL("/dashboard");

  await context.storageState({ path: authFile });

  await browser.close();
}

export default globalSetup;
