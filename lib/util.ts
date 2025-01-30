import * as dotenv from "dotenv";

dotenv.config();

export const serverAddress = `${process.env.SERVER_ADDRESS}`;
export const thisBaseUrl = `${process.env.APP_BASE_URL}`;
