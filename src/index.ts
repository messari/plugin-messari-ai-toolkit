import { copilotProvider } from "./providers/messari/index.ts";

export * as providers from "./providers";

export const messariPlugin = {
  name: "messariAiToolkit",
  description: "Messari AI Toolkit",
  actions: [],
  providers: [copilotProvider],
};
