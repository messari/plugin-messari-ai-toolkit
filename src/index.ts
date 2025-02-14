import { copilotProvider } from "./providers/copilot.ts";

export * as providers from "./providers";

const messariPlugin = {
  name: "messariAiToolkit",
  description: "Messari AI Toolkit",
  actions: [],
  providers: [copilotProvider],
};

export default messariPlugin;
