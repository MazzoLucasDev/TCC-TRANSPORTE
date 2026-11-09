import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["src/**/*.test.ts"],
    exclude: ["src/**/*.integration.test.ts"],
    coverage: {
      provider: "v8",
      include: [
        "src/domain/**",
        "src/useCases/**",
        "src/infra/http/middlewares/**",
      ],
      exclude: [
        "src/**/*.test.*",
        "src/domain/repositories/**",
        "src/domain/services/**",
        "src/**/*Data.ts",
        "src/useCases/useCase.ts",
        "src/domain/shared/errors/DomainError.ts",
      ],
    },
  },
});
