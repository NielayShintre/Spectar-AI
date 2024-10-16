import AWS from "aws-sdk";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.NEXT_PUBLIC_S3_REGION!,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY!,
  },
});

export async function getPresignedUrl(fileName: string, userId: string) {
  const fileKey = `uploads/${userId}/${Date.now()}-${fileName}`;
  const command = new PutObjectCommand({
    Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
    Key: fileKey,
  });

  const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
  return { presignedUrl, fileKey };
}

export const uploadToS3 = async (
  file: File,
  isPremium: boolean,
  chatCount: number
) => {
  // Check if the user has reached the limit
  if (!isPremium && chatCount >= 3) {
    throw new Error("Chat limit reached");
  }

  try {
    AWS.config.update({
      accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY!,
    });
    const s3 = new AWS.S3({
      params: {
        Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME,
      },
      region: "eu-north-1",
    });

    const file_key =
      "uploads/" + Date.now().toString() + file.name.replace("", "-");

    const params = {
      Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
      Key: file_key,
      Body: file,
    };

    const upload = s3
      .putObject(params)
      .on("httpUploadProgress", (event) => {
        console.log(
          "Uploading to S3....",
          parseInt(((event.loaded * 100) / event.total).toString()) + "%"
        );
      })
      .promise();

    await upload.then((data) => {
      console.log(`successfully uploaded to S3: ${data}`, file_key);
    });

    return Promise.resolve({
      file_key,
      file_name: file.name,
    });
  } catch (error) {
    console.log("Error:", error);
    throw error; // Re-throw the error to be caught in the calling function
  }
};

export function getS3Url(file_key: string) {
  const url = `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.eu-north-1.amazonaws.com/${file_key}`;
  return url;
}