import { VoyageAIClient, VoyageAIError } from "voyageai";

// Initialize the Voyage AI client with the API key
const client = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY });

/**
 * Function to get embeddings for a given text using the voyage-law-2 model.
 * @param text - The input text for which embeddings are to be generated.
 * @returns A promise that resolves to the embeddings as an array of numbers.
 */
export async function getEmbeddings(text: string): Promise<number[]> {
  try {
    // Ensure text is a string
    const textString = typeof text === "string" ? text : String(text);

    const response = await client.embed({
      input: textString,
      model: "voyage-law-2",
      inputType: "document"
    });

    console.log("Voyage AI API response:", JSON.stringify(response, null, 2));

    if (!response.data || response.data.length === 0 || !response.data[0].embedding) {
      throw new Error("No valid embedding returned from Voyage AI API");
    }

    console.log("Embedding dimension:", response.data[0].embedding.length);
    return response.data[0].embedding;
  } catch (error) {
    if (error instanceof VoyageAIError) {
      console.error(
        "Voyage AI API error:",
        error.statusCode,
        error.message,
        error.body
      );
    } else {
      console.error("Unexpected error:", error);
    }
    throw error;
  }
}

/**
 * Function to get embeddings for multiple texts using the voyage-law-2 model.
 * @param texts - An array of input texts for which embeddings are to be generated.
 * @returns A promise that resolves to an array of embeddings, each as an array of numbers.
 */
export async function getBatchEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    if (texts.length > 128) {
      throw new Error("Batch size exceeds the maximum limit of 128");
    }

    const totalTokens = texts.reduce((sum, text) => sum + text.split(' ').length, 0);
    if (totalTokens > 320000) {
      throw new Error("Total number of tokens in the batch exceeds the limit");
    }

    const response = await client.embed({
      input: texts,
      model: "voyage-law-2",
      inputType: "document"
    });

    console.log("Voyage AI API batch response:", JSON.stringify(response, null, 2));

    if (!response.data || response.data.length !== texts.length) {
      throw new Error("Unexpected number of embeddings returned from Voyage AI API");
    }

    const embeddings = response.data
      .map(item => item.embedding)
      .filter((embedding): embedding is number[] => embedding !== undefined);

    if (embeddings.length !== texts.length) {
      throw new Error("Some embeddings were undefined");
    }

    console.log("Embedding dimension:", embeddings[0].length);
    return embeddings;
  } catch (error) {
    if (error instanceof VoyageAIError) {
      console.error('Voyage AI API error:', error.statusCode, error.message, error.body);
    } else {
      console.error('Unexpected error:', error);
    }
    throw error;
  }
}
