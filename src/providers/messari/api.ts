import { elizaLogger } from "@elizaos/core";
import type { MessariAPIResponse, MessariError } from "./types";

/**
 * Makes a request to the Messari API
 * @param apiEndpoint - The Messari API endpoint
 * @param apiKey - The Messari API key
 * @param question - The question to ask
 * @returns The API response content or null if there's an error
 */
export async function callMessariAPI(
  apiEndpoint: string,
  apiKey: string,
  question: string
): Promise<string | null> {
  try {
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-messari-api-key": apiKey,
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: question,
          },
        ],
      }),
    });

    if (!response.ok) {
      const responseText = await response.text();
      const error = new Error() as MessariError;
      error.status = response.status;
      error.statusText = response.statusText;
      error.responseText = responseText;
      throw error;
    }

    const data = (await response.json()) as MessariAPIResponse;
    const res = data.data.messages[0].content;
    elizaLogger.debug("Messari API response", {
      response: res,
    });
    return res;
  } catch (error) {
    const err = error as MessariError;
    elizaLogger.error("Error calling Messari API:", {
      status: err.status,
      statusText: err.statusText,
      responseText: err.responseText,
      message: err.message,
    });
    return null;
  }
}
