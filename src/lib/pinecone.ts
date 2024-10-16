import { Pinecone, PineconeRecord } from "@pinecone-database/pinecone";
import { downloadFromS3 } from "@/lib/s3-server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import {
  Document,
  RecursiveCharacterTextSplitter,
} from "@pinecone-database/doc-splitter";
import { getEmbeddings, getBatchEmbeddings } from "./embeddings";
import md5 from "md5";
import { convertToAscii } from "./utils";
import { getPresignedGetUrl } from "@/lib/s3";
import axios from "axios";

let pinecone: Pinecone | null = null;

export const getPineconeClient = async (): Promise<Pinecone> => {
  if (!pinecone) {
    pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
  }
  return pinecone;
};

type PDFPage = {
  pageContent: string;
  metadata: {
    loc: { pageNumber: number };
  };
};

// Define a type for the metadata
type DocumentMetadata = {
  text: string;
  pageNumber: number;
};

export async function loadS3IntoPinecone(fileKey: string) {
  // 1. obtain the pdf -> fetch using pre-signed URL
  console.log("Fetching PDF from S3");
  const presignedUrl = await getPresignedGetUrl(fileKey);
  const response = await axios.get(presignedUrl, {
    responseType: "arraybuffer",
  });

  // Convert ArrayBuffer to Blob
  const blob = new Blob([response.data], { type: "application/pdf" });

  // Parse the PDF using Blob
  console.log("Parsing PDF");
  const loader = new PDFLoader(blob);
  const pages = (await loader.load()) as PDFPage[];

  // 3. split and segment the pdf
  const documents = await Promise.all(pages.map(prepareDocument));

  // 4. vectorise and embed individual documents
  const vectors = await Promise.all(documents.flat().map(embedDocument));

  // 5. upload to pinecone
  const client = await getPineconeClient();
  const pineconeIndex = await client.index("legal-ai");
  const namespace = pineconeIndex.namespace(convertToAscii(fileKey));

  console.log("Inserting vectors into Pinecone");
  await namespace.upsert(vectors);

  return documents[0];
}

async function embedDocument(doc: Document): Promise<PineconeRecord> {
  try {
    const embeddings = await getEmbeddings(doc.pageContent);
    const hash = md5(doc.pageContent);

    return {
      id: hash,
      values: embeddings,
      metadata: {
        text: doc.metadata.text,
        pageNumber: doc.metadata.pageNumber,
      } as DocumentMetadata, // Type assertion here
    };
  } catch (error) {
    console.log("error embedding document", error);
    throw error;
  }
}

export const truncateStringByByte = (str: string, bytes: number) => {
  const enc = new TextEncoder();
  return new TextDecoder("utf8").decode(enc.encode(str).slice(0, bytes));
};

async function prepareDocument(page: PDFPage) {
  let { pageContent, metadata } = page;
  pageContent = pageContent.replace(/\n/g, "");
  const splitter = new RecursiveCharacterTextSplitter();
  const docs = await splitter.splitDocuments([
    new Document({
      pageContent,
      metadata: {
        pageNumber: metadata.loc.pageNumber,
        text: truncateStringByByte(pageContent, 36000),
      },
    }),
  ]);
  return docs;
}
