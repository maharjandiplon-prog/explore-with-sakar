import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { getSessionFromRequest } from '@/lib/auth';
import { getStorageBucket, isFirebaseConfigured } from '@/lib/firebase-admin';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
];

const MIME_TO_ALLOWED_EXTENSIONS: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
  'image/avif': ['.avif'],
};

function validateImageMagicBytes(buf: Buffer, mime: string): boolean {
  if (buf.length < 12) return false;
  if (mime === 'image/jpeg') {
    return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  }
  if (mime === 'image/png') {
    return (
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47 &&
      buf[4] === 0x0d &&
      buf[5] === 0x0a &&
      buf[6] === 0x1a &&
      buf[7] === 0x0a
    );
  }
  if (mime === 'image/gif') {
    const header = buf.subarray(0, 4).toString('ascii');
    return header === 'GIF8';
  }
  if (mime === 'image/webp') {
    return (
      buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buf.subarray(8, 12).toString('ascii') === 'WEBP'
    );
  }
  if (mime === 'image/avif') {
    const ftyp = buf.subarray(4, 12).toString('ascii');
    return ftyp === 'ftypavif' || ftyp === 'ftypavis';
  }
  return false;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_BASE64_FALLBACK_SIZE = 500 * 1024; // 500KB cap for serverless data URL fallback

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate admin user
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Admin session required' }, { status: 401 });
    }

    if (process.env.VERCEL_ENV === 'preview' && process.env.ALLOW_PREVIEW_WRITES !== 'true') {
      return NextResponse.json({ error: 'Forbidden: Uploads are disabled on Vercel Preview environment' }, { status: 403 });
    }

    // 2. Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided in form data' }, { status: 400 });
    }

    // 3. Validate mime type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type (${file.type}). Only JPG, PNG, WEBP, AVIF, and GIF are permitted.` },
        { status: 400 }
      );
    }

    // 4. Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds the 10MB limit.` },
        { status: 400 }
      );
    }

    // 5. Validate file extension matches declared MIME type
    const rawExt = (path.extname(file.name) || '').toLowerCase();
    const allowedExts = MIME_TO_ALLOWED_EXTENSIONS[file.type] || [];
    if (!rawExt || !allowedExts.includes(rawExt)) {
      return NextResponse.json(
        { error: `Invalid or mismatched file extension (${rawExt || 'none'}) for MIME type ${file.type}.` },
        { status: 400 }
      );
    }

    // 6. Inspect buffer magic bytes (prevent disguised scripts/executables/polyglots)
    const arrayBuffer = await file.arrayBuffer();
    let buffer = Buffer.from(arrayBuffer);

    if (!validateImageMagicBytes(buffer, file.type)) {
      return NextResponse.json(
        { error: 'File signature does not match declared image format. Upload rejected.' },
        { status: 400 }
      );
    }

    // 7. Generate sanitized file name
    const sanitizedBase = path
      .basename(file.name, rawExt)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .slice(0, 30);
    const uniqueName = `${Date.now()}-${sanitizedBase || 'image'}${rawExt}`;

    // Auto-optimize standard bitmap images with sharp
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      try {
        let pipeline = sharp(buffer).rotate();
        const metadata = await pipeline.metadata();
        if ((metadata.width && metadata.width > 1920) || (metadata.height && metadata.height > 1920)) {
          pipeline = pipeline.resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true });
        }
        if (file.type === 'image/jpeg') {
          buffer = Buffer.from(await pipeline.jpeg({ quality: 80, mozjpeg: true }).toBuffer());
        } else if (file.type === 'image/png') {
          buffer = Buffer.from(await pipeline.png({ quality: 80, compressionLevel: 8 }).toBuffer());
        } else if (file.type === 'image/webp') {
          buffer = Buffer.from(await pipeline.webp({ quality: 80 }).toBuffer());
        }
      } catch (sharpErr) {
        console.warn('Sharp optimization skipped for upload:', sharpErr);
      }
    }

    let publicUrl = '';
    let storageProvider = 'local';

    // 6. Strategy A: Firebase Cloud Storage (preferred in production)
    if (isFirebaseConfigured()) {
      try {
        const bucket = getStorageBucket();
        const destination = `uploads/${uniqueName}`;
        const fileUpload = bucket.file(destination);

        await fileUpload.save(buffer, {
          metadata: {
            contentType: file.type,
            cacheControl: 'public, max-age=31536000',
          },
          resumable: false,
        });

        // Make publicly readable or construct public media URL
        try {
          await fileUpload.makePublic();
        } catch {
          // If uniform bucket-level access is enabled on GCP bucket, makePublic() may throw;
          // in that case, the storage.googleapis.com URL is used.
        }

        publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;
        storageProvider = 'firebase-storage';
      } catch (firebaseErr: any) {
        console.error('[upload] Firebase Cloud Storage upload failed, attempting local fallback:', firebaseErr?.message || firebaseErr);
      }
    }

    // 7. Strategy B: Local Disk (for local dev or fallback)
    if (!publicUrl) {
      try {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const filePath = path.join(uploadsDir, uniqueName);
        fs.writeFileSync(filePath, buffer);
        publicUrl = `/uploads/${uniqueName}`;
        storageProvider = 'local-fs';
      } catch (fsErr) {
        // Strategy C: Read-only serverless environment without cloud storage credentials
        console.warn('Read-only filesystem detected, falling back to base64 Data URL:', fsErr);
        if (buffer.length > MAX_BASE64_FALLBACK_SIZE) {
          return NextResponse.json(
            {
              error: `Image size (${(buffer.length / 1024).toFixed(0)} KB) exceeds the 500 KB limit for serverless storage fallback. Configure Firebase Cloud Storage environment variables for persistent uploads.`,
            },
            { status: 413 }
          );
        }
        publicUrl = `data:${file.type};base64,${buffer.toString('base64')}`;
        storageProvider = 'base64-data-url';
      }
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: uniqueName,
      size: buffer.length,
      mimeType: file.type,
      provider: storageProvider,
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: error?.message || 'File upload failed' }, { status: 500 });
  }
}
