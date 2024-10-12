import { Pinecone } from "@pinecone-database/pinecone";
import { convertToAscii } from "./utils";
import { getEmbeddings } from "./embeddings";

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

export async function getMatchesFromEmbeddings(
  embeddings: number[],
  fileKey: string
) {
  try {
    const index = pc.index("legal-ai");
    const namespace = index.namespace(convertToAscii(fileKey));

    const queryResponse = await namespace.query({
      vector: embeddings,
      topK: 10, // Increased from 5 to 10 for more potential matches
      includeMetadata: true,
    });

    console.log("Pinecone query response:", JSON.stringify(queryResponse, null, 2));
    return queryResponse.matches || [];
  } catch (error) {
    console.error("Error querying embeddings:", error);
    throw error;
  }
}

export async function getContext(query: string, fileKey: string) {
  try {
    const queryEmbeddings = await getEmbeddings(query);
    const matches = await getMatchesFromEmbeddings(queryEmbeddings, fileKey);

    console.log("Matches from Pinecone:", JSON.stringify(matches, null, 2));

    const qualifyingDocs = matches.filter(
      (match) => match.score && match.score > 0.6 // Lowered threshold from 0.7 to 0.6
    );
    console.log("Qualifying docs:", JSON.stringify(qualifyingDocs, null, 2));

    type Metadata = {
      text: string;
      pageNumber: number;
    };

    let docs = qualifyingDocs.map((match) => (match.metadata as Metadata).text);
    
    if (docs.length === 0) {
      console.warn("No qualifying documents found. Using all matches.");
      docs = matches.map((match) => (match.metadata as Metadata).text);
    }

    const context = docs.join("\n").substring(0, 3000);
    console.log("Final context:", context);
    return context;
  } catch (error) {
    console.error("Error getting context:", error);
    throw error;
  }
}
