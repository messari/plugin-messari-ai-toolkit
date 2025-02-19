import {
  AgentRuntime,
  ModelClass,
  Provider,
  elizaLogger,
  generateText,
  composeContext,
} from "@elizaos/core";
import type { Memory, State } from "@elizaos/core";
import { callMessariAPI } from "./api";
import { DEFAULT_CONFIG, validateConfig } from "./config";
import { findRelevantMemory, getRecentMessages, storeMemory } from "./memory";

// Template for question generation
const COPILOT_QUESTION_TEMPLATE = `IMPORTANT: Your primary task is to identify research questions in the CURRENT MESSAGE. Recent messages are provided only as supporting context.

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

export const copilotProvider: Provider = {
  get: async (runtime: AgentRuntime, message: Memory, state?: State) => {
    // Validate configuration
    validateConfig(DEFAULT_CONFIG);

    const apiKey = runtime.getSetting(DEFAULT_CONFIG.ENV_API_KEY);
    if (!apiKey) {
      elizaLogger.error("Messari API key not found in runtime settings");
      return null;
    }

    const contextState = {
      ...state,
      currentMessage: message.content.text,
      recentMessages: getRecentMessages(
        state?.recentMessagesData,
        DEFAULT_CONFIG.RECENT_MESSAGES_COUNT
      ),
    };

    const questionContext = composeContext({
      state: contextState,
      template: COPILOT_QUESTION_TEMPLATE,
    });

    elizaLogger.debug("Generated question context", {
      context: questionContext,
    });

    const copilotQuestion = await generateText({
      runtime,
      context: questionContext,
      modelClass: ModelClass.MEDIUM,
    });

    if (copilotQuestion === "NONE") {
      elizaLogger.info("No research questions identified in the message");
      return null;
    }

    elizaLogger.info("Processing research question", {
      question: copilotQuestion,
    });

    // Check memory first
    const memorizedResponse = await findRelevantMemory(
      runtime,
      message,
      copilotQuestion,
      DEFAULT_CONFIG.MEMORY_TTL_HOURS
    );

    if (memorizedResponse) {
      elizaLogger.info("Using cached response from memory");
      return memorizedResponse;
    }

    // If no memory found, call API
    const apiResponse = await callMessariAPI(
      DEFAULT_CONFIG.API_ENDPOINT,
      apiKey,
      copilotQuestion
    );

    if (apiResponse) {
      // Store successful response in memory
      await storeMemory(runtime, message, copilotQuestion, apiResponse);
    }

    return apiResponse;
  },
};
