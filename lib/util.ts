import * as dotenv from "dotenv";

dotenv.config();

export const serverAddress = `${process.env.SERVER_ADDRESS}`;

export const baseCookieOptions = {
  httpOnly: true,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  domain: "localhost",
};
