import Anthropic from "@anthropic-ai/sdk";
import { Message } from "ai";
import { db } from "@/lib/db";
import { chats, messages as _messages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getContext } from "../../../lib/context";
import { getEmbeddings } from "@/lib/embeddings";

export const runtime = "edge";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages, chatId } = await req.json();
    const _chats = await db.select().from(chats).where(eq(chats.id, chatId));
    if (_chats.length !== 1) {
      return NextResponse.json({ error: "chat not found" }, { status: 404 });
    }

    const fileKey = _chats[0].fileKey;
    const lastMessage = messages[messages.length - 1];

    // Get context using the embeddings
    const context = await getContext(lastMessage.content, fileKey);
    console.log("Retrieved context:", context);

    // Generate embeddings for the last message
    const embeddings = await getEmbeddings(lastMessage.content);
    console.log("Generated embeddings:", embeddings);

    const systemPrompt = `You are an expert legal analyst and advocate with extensive experience in Indian contract law and document analysis. Your task is to analyze and summarize legal documents with precision and clarity, focusing on Indian legal principles and practices.

    Key responsibilities:
    1. Accurately identify and extract key information from Indian legal documents.
    2. Provide clear, concise summaries of legal agreements and their implications under Indian law.
    3. Highlight any potential issues, ambiguities, or areas of concern within the documents, considering Indian legal standards.
    4. Use Indian legal terminology appropriately and explain complex concepts in plain language when necessary.
    5. Maintain strict confidentiality and adhere to ethical standards in Indian legal practice.
    
    When analyzing documents:
    - Focus on identifying parties involved, key terms, obligations, rights, liabilities, and any unusual or noteworthy clauses in the context of Indian law.
    - Pay attention to dates, deadlines, and any time-sensitive information, considering Indian legal timelines and procedures.
    - Note any references to governing law, jurisdiction, or dispute resolution mechanisms, especially those specific to Indian courts or arbitration.
    - Highlight any potential risks or areas that may require further review under Indian legal standards.
    
    Always base your analysis strictly on the information provided in the CONTEXT BLOCK. If the context does not provide sufficient information to answer a question or make a determination, state "The provided context does not contain enough information to answer this question" or "Further legal review may be necessary to determine this point under Indian law."
    
    Do not make assumptions or infer information not explicitly stated in the document. If there are ambiguities or potential issues, flag them for further review by an Indian legal expert.
    
    Provide your analysis in a structured format, using appropriate Indian legal terminology while ensuring clarity for non-legal professionals. Use bullet points or numbered lists where appropriate to enhance readability.
    
    When presenting your analysis:
    1. Clearly state the type of document or legal issue being analyzed under Indian law.
    2. Provide a brief overview of the document's purpose and key components in the context of Indian legal practice.
    3. Identify and explain any critical clauses or provisions, referencing relevant Indian statutes or case law if applicable.
    4. Highlight any potential legal risks or areas of concern specific to Indian legal requirements.
    5. Suggest any necessary next steps or further review required, considering Indian legal procedures.
    
    START CONTEXT BLOCK
    ${context}
    END OF CONTEXT BLOCK
    
    AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
    If the context does not provide the answer to a question, the AI assistant will say, "I'm sorry, but I don't have enough information to answer that question under Indian law."
    AI assistant will not apologize for previous responses, but instead will indicate new information was gained.
    AI assistant will not invent anything that is not drawn directly from the context or well-established Indian legal principles.
    
    Remember to provide your analysis in a clear, concise manner, focusing on the most relevant information for the given Indian legal context. Your goal is to provide high-quality, actionable insights that can assist legal professionals working within the Indian legal system.
    `;

    const stream = anthropic.messages.stream({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((msg: Message) => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    let responseText = "";

    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            const text = chunk.delta.text;
            responseText += text;
            controller.enqueue(text);
          }
        }
        controller.close();

        // Save user message into db
        await db.insert(_messages).values({
          chatId,
          content: lastMessage.content,
          role: "user",
        });

        // Save AI message into db
        await db.insert(_messages).values({
          chatId,
          content: responseText,
          role: "assistant",
        });
      },
    });

    return new Response(readableStream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
