import "dotenv/config";
import { createApp } from "./app";

const production = process.env.NODE_ENV === "production";
if (
  production &&
  (!process.env.PUBLIC_BASE_URL || !process.env.ALLOWED_ORIGINS)
)
  throw new Error("PUBLIC_BASE_URL ve ALLOWED_ORIGINS gereklidir.");
const port = Number(process.env.API_PORT ?? 3001);
const { app, db } = createApp({
  databasePath: process.env.DATABASE_PATH ?? "./data/metek.sqlite",
  publicBaseUrl: process.env.PUBLIC_BASE_URL ?? `http://localhost:${port}`,
  origins: (
    process.env.ALLOWED_ORIGINS ?? "http://localhost:8081,http://127.0.0.1:8081"
  ).split(","),
  production,
  trustProxy: process.env.TRUST_PROXY === "1",
  remoteCards: process.env.REMOTE_CARDS_URL ? {
    url: process.env.REMOTE_CARDS_URL,
    key: process.env.REMOTE_CARDS_KEY ?? "",
  } : undefined,
});
const server = app.listen(port, process.env.API_HOST ?? "127.0.0.1", () =>
  console.log(`METEK HERO vCard API hazır: ${port}`),
);
function close() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on("SIGINT", close);
process.on("SIGTERM", close);
