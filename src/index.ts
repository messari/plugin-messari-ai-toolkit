import { copilotProvider } from "./providers/copilot.ts";

export * as providers from "./providers";

export const messariPlugin = {
  name: "messariAiToolkit",
  description: "Messari AI Toolkit",
  actions: [],
  providers: [copilotProvider],
};
