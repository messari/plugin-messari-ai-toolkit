var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/providers/copilot.ts
import {
  composeContext,
  ModelClass,
  elizaLogger,
  generateText
} from "@elizaos/core";
var CONFIG = {
  RECENT_MESSAGES_COUNT: 5,
  API_ENDPOINT: "https://api.messari.io/ai/v1/chat/completions",
  ENV_API_KEY: "MESSARI_API_KEY"
};
var COPILOT_QUESTION_TEMPLATE = `IMPORTANT: Your primary task is to identify research questions in the CURRENT MESSAGE. Recent messages are provided only as supporting context.

Current message to analyze: {{currentMessage}}
Supporting context from recent messages (last ${CONFIG.RECENT_MESSAGES_COUNT}): {{recentMessages}}

First, focus on the current message and identify if it contains any research questions or requests. Only if the current message is ambiguous or references previous messages, consider the supporting context.

Consider the following as research questions:
1. Requests for market data, statistics, or metrics
2. Questions about rankings or comparisons
3. Requests for historical data or trends
4. Questions about specific protocols, tokens, or platforms
5. Requests for financial analysis or performance data

Extract and output the exact research question from the CURRENT MESSAGE. If multiple questions exist in the current message, output the most relevant one.
If there are NO research questions in the current message, output "NONE".

Remember:
- Focus primarily on the current message
- Any request for data, rankings, or market information should be considered a research question, even if not phrased as a question
- Only use recent messages for context if the current message is ambiguous or references them directly

Examples:
- Current: "what are the top 10 L2s by fees" -> "what are the top 10 L2s by fees"
- Current: "show me ETH price" -> "what is the current price of ETH"
- Current: "TVL of Arbitrum" -> "what is the current TVL of Arbitrum"
- Current: "as I asked before, what's the value?" (ambiguous) -> Use context to determine the specific metric being asked about`;
async function callMessariAPI(apiKey, question) {
  try {
    const response = await fetch(CONFIG.API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-messari-api-key": apiKey
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: question
          }
        ]
      })
    });
    if (!response.ok) {
      const responseText = await response.text();
      const error = new Error();
      error.status = response.status;
      error.statusText = response.statusText;
      error.responseText = responseText;
      throw error;
    }
    const data = await response.json();
    const res = data.data.messages[0].content;
    elizaLogger.debug("Messari API response", {
      response: res
    });
    return res;
  } catch (error) {
    const err = error;
    elizaLogger.error("Error calling Messari API:", {
      status: err.status,
      statusText: err.statusText,
      responseText: err.responseText,
      message: err.message
    });
    return null;
  }
}
function getRecentMessages(state) {
  var _a;
  return ((_a = state == null ? void 0 : state.recentMessagesData) == null ? void 0 : _a.slice(-CONFIG.RECENT_MESSAGES_COUNT).map((m) => m.content.text).join("\n")) || "";
}
var copilotProvider = {
  get: async (runtime, message, state) => {
    const apiKey = runtime.getSetting(CONFIG.ENV_API_KEY);
    if (!apiKey) {
      elizaLogger.error("Messari API key not found in runtime settings");
      return null;
    }
    const contextState = {
      ...state,
      currentMessage: message.content.text,
      recentMessages: getRecentMessages(state)
    };
    const questionContext = composeContext({
      state: contextState,
      template: COPILOT_QUESTION_TEMPLATE
    });
    elizaLogger.debug("Generated question context", {
      context: questionContext
    });
    const copilotQuestion = await generateText({
      runtime,
      context: questionContext,
      modelClass: ModelClass.MEDIUM
    });
    if (copilotQuestion === "NONE") {
      elizaLogger.info("No research questions identified in the message");
      return null;
    }
    elizaLogger.info("Processing research question", {
      question: copilotQuestion
    });
    return await callMessariAPI(apiKey, copilotQuestion);
  }
};

// src/providers/index.ts
var providers_exports = {};
__export(providers_exports, {
  copilotProvider: () => copilotProvider
});

// src/index.ts
var messariPlugin = {
  name: "messariAiToolkit",
  description: "Messari AI Toolkit",
  actions: [],
  providers: [copilotProvider]
};
export {
  messariPlugin,
  providers_exports as providers
};
//# sourceMappingURL=index.js.map