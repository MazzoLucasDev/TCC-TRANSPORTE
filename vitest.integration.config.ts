import { defineConfig } from "vitest/config";
import { config } from "dotenv";

config({ path: ".env.test" }); // carrega especificamente o .env.test

export default defineConfig({
  test: {
    globals: true,
    include: ["src/**/*.integration.test.ts"],
  },
});
