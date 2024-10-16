// FileUpload.tsx
"use client";

import { uploadToS3 } from "@/lib/s3";
import { useMutation } from "@tanstack/react-query";
import { Inbox, Loader2 } from "lucide-react";
import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import UpgradeModal from "@/components/UpgradeModal";

interface FileUploadProps {
  isPremium: boolean;
  chatCount: number;
  onUpgradeRequired: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({
  isPremium,
  chatCount,
  onUpgradeRequired,
}) => {
  const [uploading, setUploading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const router = useRouter();

  const { mutate, isPending } = useMutation({
    mutationFn: async ({
      file_key,
      file_name,
    }: {
      file_key: string;
      file_name: string;
    }) => {
      const response = await axios.post("/api/create-chat", {
        file_key,
        file_name,
      });
      return response.data;
    },
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File too large");
        return;
      }

      try {
        setUploading(true);
        
        // Get pre-signed URL
        const presignedUrlResponse = await axios.post("/api/get-presigned-url", {
          fileName: file.name,
        });
        const { presignedUrl, fileKey } = presignedUrlResponse.data;

        console.log("Pre-signed URL:", presignedUrl);
        console.log("File Key:", fileKey);

        // Upload file using pre-signed URL
        await axios.put(presignedUrl, file, {
          headers: {
            "Content-Type": file.type,
          },
        });

        console.log("File uploaded successfully");

        // Use existing uploadToS3 function (you might want to refactor this later)
        const data = await uploadToS3(file, isPremium, chatCount);
        if (!data?.file_key || !data.file_name) {
          toast.error("Something went wrong");
          return;
        }
        mutate(data, {
          onSuccess: ({ chat_id }) => {
            toast.success("Chat created!");
            router.push(`/chat/${chat_id}`);
          },
          onError: (err) => {
            toast.error("Error creating chat");
            console.error(err);
          },
        });
      } catch (error: any) {
        if (error.message === "Chat limit reached") {
          setShowUpgradeModal(true);
        } else {
          console.log(error);
          toast.error("Error uploading file");
        }
      } finally {
        setUploading(false);
      }
    },
  });

  return (
    <>
      <div
        {...getRootProps()}
        className={`p-4 bg-white rounded-lg border-2 border-dashed 
             ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"}
             ${uploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
           `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center text-center">
          {uploading ? (
            <>
              <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
              <p className="mt-2 text-sm text-gray-500">
                Uploading your document...
              </p>
            </>
          ) : (
            <>
              <Inbox className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">
                Drag and drop your file here, or click to select a file
              </p>
              <p className="mt-1 text-xs text-gray-500">(PDF up to 10MB)</p>
            </>
          )}
        </div>
      </div>
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={onUpgradeRequired}
      />
    </>
  );
};

export default FileUpload;
