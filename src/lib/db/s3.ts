import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
  region: process.env.AWS_REGION ?? "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  },
});

export const S3_BUCKET = process.env.AWS_S3_BUCKET ?? "evereach-bucket";

/** Uploads a photo buffer to S3 and returns its key */
export async function uploadToS3(key: string, bytes: Buffer, mime: string) {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: bytes,
    ContentType: mime,
  });

  await s3Client.send(command);
  return key;
}

/** Fetches photo bytes from S3 */
export async function getFromS3(key: string): Promise<{ bytes: Buffer; mime?: string } | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });

    const response = await s3Client.send(command);
    if (!response.Body) return null;

    const byteArray = await response.Body.transformToByteArray();
    return {
      bytes: Buffer.from(byteArray),
      mime: response.ContentType,
    };
  } catch {
    return null;
  }
}
