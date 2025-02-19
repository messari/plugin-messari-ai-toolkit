import { AgentRuntime, elizaLogger, embed } from "@elizaos/core";
import type { Memory } from "@elizaos/core";
import type { MessariMemory } from "./types";

/**
 * Searches for a relevant memory that might answer the question
 * @param runtime - The agent runtime
 * @param message - The current message
 * @param question - The research question to find memory for
 * @param ttlHours - How long to consider memories valid
 * @returns The memory content if found, null otherwise
 */
export async function findRelevantMemory(
  runtime: AgentRuntime,
  message: Memory,
  question: string,
  ttlHours: number
): Promise<string | null> {
  try {
    const memories = await runtime.knowledgeManager.searchMemoriesByEmbedding(
      await embed(runtime, question),
      {
        match_threshold: 0.8,
        count: 1,
        roomId: message.roomId,
        unique: true,
      }
    );

    if (memories && memories.length > 0) {
      const memory = memories[0];
      const age = new Date().getTime() - (memory.createdAt || 0);

      if (age <= ttlHours * 60 * 60 * 1000) {
        elizaLogger.info("Found relevant memory", {
          question,
          memoryAge: age,
        });
        return memory.content.text;
      }
    }
    return null;
  } catch (error) {
    elizaLogger.error("Error searching memories:", error);
    return null;
  }
}

/**
 * Stores an API response in memory
 * @param runtime - The agent runtime
 * @param message - The current message
 * @param question - The original question
 * @param response - The API response to store
 */
export async function storeMemory(
  runtime: AgentRuntime,
  message: Memory,
  question: string,
  response: string
): Promise<void> {
  try {
    const memory: MessariMemory = {
      userId: message.userId,
      agentId: runtime.agentId,
      roomId: message.roomId,
      content: {
        text: response,
        source: "messari",
        action: question,
      },
      createdAt: new Date().getTime(),
    };

    await runtime.knowledgeManager.createMemory(memory, true);
    elizaLogger.info("Stored response in memory", {
      question,
    });
  } catch (error) {
    elizaLogger.error("Error storing memory:", error);
  }
}

/**
 * Extracts recent messages from state
 * @param recentMessagesData - Array of recent messages
 * @param count - Number of recent messages to include
 * @returns A string of recent messages
 */
export function getRecentMessages(
  recentMessagesData: Memory[] | undefined,
  count: number
): string {
  return (
    recentMessagesData
      ?.slice(-count)
      .map((m) => m.content.text)
      .join("\n") || ""
  );
}
