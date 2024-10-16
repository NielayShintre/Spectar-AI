// PDFViewer.tsx
"use client";
import React, { useEffect, useState } from "react";
import { getPresignedGetUrl } from "@/lib/s3";

type Props = { fileKey: string };

const PDFViewer = ({ fileKey }: Props) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchPresignedUrl = async () => {
      try {
        console.log("Fetching presigned URL for fileKey:", fileKey);
        const url = await getPresignedGetUrl(fileKey);
        console.log("Received presigned URL:", url);
        setPdfUrl(url);
      } catch (error) {
        console.error("Error fetching pre-signed URL:", error);
      }
    };

    fetchPresignedUrl();
  }, [fileKey]);

  if (!pdfUrl) {
    return <div>Loading PDF...</div>;
  }

  console.log("Rendering PDF with URL:", pdfUrl);
  return (
    <iframe
      src={`https://docs.google.com/gview?url=${encodeURIComponent(
        pdfUrl
      )}&embedded=true`}
      className="w-full h-full border-2 border-[#000000] border-dashed"
    ></iframe>
  );
};

export default PDFViewer;
