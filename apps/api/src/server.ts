import { createApp } from "./app.js";

const { app, env } = createApp();

async function start(): Promise<void> {
  try {
    await app.listen({
      host: "0.0.0.0",
      port: env.port
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void start();
