import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Empty string counts as unset, so an `S3_ENDPOINT=` override cleanly flips
// the client to real AWS S3 (default credential chain → IAM role in prod).
const endpoint = process.env.S3_ENDPOINT || undefined;
const BUCKET = process.env.S3_BUCKET ?? 'receipts';
const PRESIGN_EXPIRY_SECONDS = 5 * 60; // 5 minutes

// The same client works against MinIO locally and real S3 in production —
// driven entirely by S3_ENDPOINT being set (local) or unset (prod).
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  endpoint,
  forcePathStyle: !!endpoint, 
  credentials: endpoint
    ? {
        accessKeyId: process.env.MINIO_ROOT_USER!,
        secretAccessKey: process.env.MINIO_ROOT_PASSWORD!,
      }
    : undefined,
});

export const getUploadUrl = (s3Key: string, contentType: string): Promise<string> => {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: s3Key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, command, { expiresIn: PRESIGN_EXPIRY_SECONDS });
};

export const getDownloadUrl = (s3Key: string): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: s3Key,
  });
  return getSignedUrl(s3, command, { expiresIn: PRESIGN_EXPIRY_SECONDS });
};
