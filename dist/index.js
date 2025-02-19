var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/providers/messari/index.ts
import {
  ModelClass,
  elizaLogger as elizaLogger3,
  generateText,
  composeContext
} from "@elizaos/core";

// src/providers/messari/api.ts
import { elizaLogger } from "@elizaos/core";
async function callMessariAPI(apiEndpoint, apiKey, question) {
  try {
    const response = await fetch(apiEndpoint, {
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

// src/providers/messari/config.ts
var DEFAULT_CONFIG = {
  RECENT_MESSAGES_COUNT: 5,
  API_ENDPOINT: "https://api.messari.io/ai/v1/chat/completions",
  ENV_API_KEY: "MESSARI_API_KEY",
  MEMORY_TTL_HOURS: 24
};
function validateConfig(config) {
  if (config.RECENT_MESSAGES_COUNT < 1) {
    throw new Error("RECENT_MESSAGES_COUNT must be greater than 0");
  }
  if (config.MEMORY_TTL_HOURS < 1) {
    throw new Error("MEMORY_TTL_HOURS must be greater than 0");
  }
  if (!config.API_ENDPOINT.startsWith("https://")) {
    throw new Error("API_ENDPOINT must be a secure HTTPS URL");
  }
  if (!config.ENV_API_KEY) {
    throw new Error("ENV_API_KEY must be specified");
  }
}

// src/providers/messari/memory.ts
import { elizaLogger as elizaLogger2, embed } from "@elizaos/core";
async function findRelevantMemory(runtime, message, question, ttlHours) {
  try {
    const memories = await runtime.knowledgeManager.searchMemoriesByEmbedding(
      await embed(runtime, question),
      {
        match_threshold: 0.8,
        count: 1,
        roomId: message.roomId,
        unique: true
      }
    );
    if (memories && memories.length > 0) {
      const memory = memories[0];
      const age = (/* @__PURE__ */ new Date()).getTime() - (memory.createdAt || 0);
      if (age <= ttlHours * 60 * 60 * 1e3) {
        elizaLogger2.info("Found relevant memory", {
          question,
          memoryAge: age
        });
        return memory.content.text;
      }
    }
    return null;
  } catch (error) {
    elizaLogger2.error("Error searching memories:", error);
    return null;
  }
}
async function storeMemory(runtime, message, question, response) {
  try {
    const memory = {
      userId: message.userId,
      agentId: runtime.agentId,
      roomId: message.roomId,
      content: {
        text: response,
        source: "messari",
        action: question
      },
      createdAt: (/* @__PURE__ */ new Date()).getTime()
    };
    await runtime.knowledgeManager.createMemory(memory, true);
    elizaLogger2.info("Stored response in memory", {
      question
    });
  } catch (error) {
    elizaLogger2.error("Error storing memory:", error);
  }
}
function getRecentMessages(recentMessagesData, count) {
  return (recentMessagesData == null ? void 0 : recentMessagesData.slice(-count).map((m) => m.content.text).join("\n")) || "";
}

// src/providers/messari/index.ts
var COPILOT_QUESTION_TEMPLATE = `IMPORTANT: Your primary task is to identify research questions in the CURRENT MESSAGE. Recent messages are provided only as supporting context.

Current message to analyze: {{currentMessage}}
Supporting context from recent messages (last ${DEFAULT_CONFIG.RECENT_MESSAGES_COUNT}): {{recentMessages}}

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
var copilotProvider = {
  get: async (runtime, message, state) => {
    validateConfig(DEFAULT_CONFIG);
    const apiKey = runtime.getSetting(DEFAULT_CONFIG.ENV_API_KEY);
    if (!apiKey) {
      elizaLogger3.error("Messari API key not found in runtime settings");
      return null;
    }
    const contextState = {
      ...state,
      currentMessage: message.content.text,
      recentMessages: getRecentMessages(
        state == null ? void 0 : state.recentMessagesData,
        DEFAULT_CONFIG.RECENT_MESSAGES_COUNT
      )
    };
    const questionContext = composeContext({
      state: contextState,
      template: COPILOT_QUESTION_TEMPLATE
    });
    elizaLogger3.debug("Generated question context", {
      context: questionContext
    });
    const copilotQuestion = await generateText({
      runtime,
      context: questionContext,
      modelClass: ModelClass.MEDIUM
    });
    if (copilotQuestion === "NONE") {
      elizaLogger3.info("No research questions identified in the message");
      return null;
    }
    elizaLogger3.info("Processing research question", {
      question: copilotQuestion
    });
    const memorizedResponse = await findRelevantMemory(
      runtime,
      message,
      copilotQuestion,
      DEFAULT_CONFIG.MEMORY_TTL_HOURS
    );
    if (memorizedResponse) {
      elizaLogger3.info("Using cached response from memory");
      return memorizedResponse;
    }
    const apiResponse = await callMessariAPI(
      DEFAULT_CONFIG.API_ENDPOINT,
      apiKey,
      copilotQuestion
    );
    if (apiResponse) {
      await storeMemory(runtime, message, copilotQuestion, apiResponse);
    }
    return apiResponse;
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