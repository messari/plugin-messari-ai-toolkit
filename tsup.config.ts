import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "dist",
  sourcemap: true,
  clean: true,
  dts: true,
  format: ["esm"],
  external: ["fs", "path", "https", "http"],
});
