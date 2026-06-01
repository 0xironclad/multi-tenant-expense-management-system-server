import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { getOrgRole } from '../lib/orgRole';
import { getUploadUrl, getDownloadUrl } from '../lib/s3';
import { createFileRecord, findFileByS3Key } from '../lib/files.lib';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

// Strip path separators and anything that isn't a safe filename char, so the
// client-supplied name can't escape the key prefix or inject weird keys.
const sanitiseFilename = (filename: string): string => {
  const base = filename.split(/[/\\]/).pop() ?? 'file';
  return base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200) || 'file';
};

export const uploadUrlHandler = async (req: Request, res: Response): Promise<void> => {
  const authUserId = req.headers['x-user-id'] as string;
  if (!authUserId) {
    res.status(401).json({ error: 'Missing identity header' });
    return;
  }

  const { filename, mimeType, orgId } = req.body;
  if (!filename || !mimeType || !orgId) {
    res.status(400).json({ error: 'filename, mimeType and orgId are required' });
    return;
  }

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    res.status(400).json({
      error: `Unsupported file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
    });
    return;
  }

  try {
    const role = await getOrgRole(authUserId, orgId);
    if (!role) {
      res.status(403).json({ error: 'You are not a member of this organisation' });
      return;
    }

    const s3Key = `receipts/${orgId}/${randomUUID()}-${sanitiseFilename(filename)}`;
    const uploadUrl = await getUploadUrl(s3Key, mimeType);

    await createFileRecord({ s3Key, uploadedBy: authUserId, orgId, mimeType });

    res.status(201).json({ uploadUrl, s3Key });
  } catch (err) {
    console.error('Upload URL error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const downloadUrlHandler = async (req: Request, res: Response): Promise<void> => {
  const authUserId = req.headers['x-user-id'] as string;
  if (!authUserId) {
    res.status(401).json({ error: 'Missing identity header' });
    return;
  }

  const { s3Key } = req.body;
  if (!s3Key) {
    res.status(400).json({ error: 's3Key is required' });
    return;
  }

  try {
    const file = await findFileByS3Key(s3Key);
    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    // Tenant isolation: the caller must belong to the org that owns the file.
    const role = await getOrgRole(authUserId, file.orgId);
    if (!role) {
      res.status(403).json({ error: 'You do not have access to this file' });
      return;
    }

    const downloadUrl = await getDownloadUrl(s3Key);
    res.status(200).json({ downloadUrl });
  } catch (err) {
    console.error('Download URL error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
