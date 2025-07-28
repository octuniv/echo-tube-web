import { test as setup } from "@playwright/test";
import path from "path";
import * as dotenv from "dotenv";
import { User } from "@/lib/definition";
import { signUpAndLogin } from "./util/auth-utils";
import { createTestUser } from "./util/test-utils";

dotenv.config({ path: ".env.e2e.test" });

const authFile = path.join(__dirname, "./.auth/user.json");

const account = createTestUser({
  name: process.env.tester_name as string,
  nickname: process.env.tester_nickname as string,
  email: process.env.tester_email as string,
  password: process.env.tester_password as string,
});

setup("authenticate (login)", async ({ page, context }) => {
  await signUpAndLogin({ account, page, context });

  await page.context().storageState({ path: authFile });
});
