import { eq } from 'drizzle-orm';
import { db, files } from '../db';

export const createFileRecord = async (data: {
  s3Key: string;
  uploadedBy: string;
  orgId: string;
  mimeType: string;
}) => {
  const [file] = await db
    .insert(files)
    .values({
      s3Key: data.s3Key,
      uploadedBy: data.uploadedBy,
      orgId: data.orgId,
      mimeType: data.mimeType,
    })
    .returning();
  return file;
};

export const findFileByS3Key = async (s3Key: string) => {
  const [file] = await db.select().from(files).where(eq(files.s3Key, s3Key));
  return file ?? null;
};
