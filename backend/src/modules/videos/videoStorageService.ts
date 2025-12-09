import dotenv from 'dotenv';
import { Client as MinioClient } from 'minio';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import { VideoRecord } from './videoRepository';

dotenv.config();

type VideoStorageMode = 'filesystem' | 'minio';

const storageModeEnvironment: string =
  process.env.VIDEO_STORAGE_MODE || 'filesystem';
const videoStorageMode: VideoStorageMode =
  storageModeEnvironment === 'minio' ? 'minio' : 'filesystem';

let minioClient: MinioClient | null = null;
let minioBucketName: string | null = null;

if (videoStorageMode === 'minio') {
  const minioEndpointEnvironment: string =
    process.env.MINIO_ENDPOINT || 'http://localhost:9000';
  const minioAccessKey: string = process.env.MINIO_ACCESS_KEY || '';
  const minioSecretKey: string = process.env.MINIO_SECRET_KEY || '';
  const minioBucketEnvironment: string | undefined =
    process.env.MINIO_BUCKET_NAME;

  if (!minioAccessKey || !minioSecretKey || !minioBucketEnvironment) {
    throw new Error(
      'MINIO_ACCESS_KEY, MINIO_SECRET_KEY, and MINIO_BUCKET_NAME must be set when VIDEO_STORAGE_MODE=minio',
    );
  }

  const endpointUrl = new URL(minioEndpointEnvironment);

  const minioHost: string = endpointUrl.hostname;
  const minioPort: number =
    endpointUrl.port !== ''
      ? Number(endpointUrl.port)
      : endpointUrl.protocol === 'https:'
        ? 443
        : 80;
  const shouldUseSSL: boolean = endpointUrl.protocol === 'https:';

  minioClient = new MinioClient({
    endPoint: minioHost,
    port: minioPort,
    useSSL: shouldUseSSL,
    accessKey: minioAccessKey,
    secretKey: minioSecretKey,
  });

  minioBucketName = minioBucketEnvironment;
}

export function getVideoStorageMode(): VideoStorageMode {
  return videoStorageMode;
}

/**
 * Generate the stream URL for a given video record, depending on storage mode.
 */
export async function getVideoStreamUrl(
  videoRecord: VideoRecord,
): Promise<string> {
  if (videoStorageMode === 'filesystem') {
    return `/api/videos/${videoRecord.id}/stream`;
  }

  if (!minioClient || !minioBucketName) {
    throw new Error('MinIO client is not configured');
  }

  const objectKey: string = videoRecord.videoPath;
  const expiresInSeconds: number = 60 * 60; // 1 hour

  return await minioClient.presignedGetObject(
    minioBucketName,
    objectKey,
    expiresInSeconds,
  );
}

/**
 * Generate a public thumbnail URL (or null) from the thumbnail_path stored in the database.
 * For new videos, we treat videoRecord.thumbnailUrl as a *path* / object key.
 */
export async function getVideoThumbnailUrl(
  videoRecord: VideoRecord,
): Promise<string | null> {
  if (!videoRecord.thumbnailUrl) {
    return null;
  }

  if (videoStorageMode === 'filesystem') {
    // Serve from /media route that points at MEDIA_DIRECTORY
    return `/media/${videoRecord.thumbnailUrl}`;
  }

  if (!minioClient || !minioBucketName) {
    throw new Error('MinIO client is not configured');
  }

  const objectKey: string = videoRecord.thumbnailUrl;
  const expiresInSeconds: number = 60 * 60; // 1 hour

  return await minioClient.presignedGetObject(
    minioBucketName,
    objectKey,
    expiresInSeconds,
  );
}

/**
 * Use ffmpeg to generate a thumbnail (JPEG) from a video buffer.
 * Writes a temporary input file, extracts a frame at 1 second, reads it back as Buffer.
 */
async function generateThumbnailBuffer(
  originalFileName: string,
  fileBuffer: Buffer,
): Promise<Buffer> {
  const temporaryDirectory = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), 'miniflix-video-'),
  );

  const fileExtension: string = path.extname(originalFileName) || '.mp4';
  const inputFilePath: string = path.join(
    temporaryDirectory,
    `input${fileExtension}`,
  );
  const outputFilePath: string = path.join(temporaryDirectory, 'thumbnail.jpg');

  await fs.promises.writeFile(inputFilePath, fileBuffer);

  await new Promise<void>((resolve, reject) => {
    const ffmpegProcess = spawn('ffmpeg', [
      '-y', // overwrite output if exists
      '-i',
      inputFilePath,
      '-ss',
      '00:00:01',
      '-vframes',
      '1',
      outputFilePath,
    ]);

    ffmpegProcess.on('error', (error) => {
      reject(error);
    });

    ffmpegProcess.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });
  });

  const thumbnailBuffer: Buffer = await fs.promises.readFile(outputFilePath);

  // Clean up the temporary directory
  await fs.promises.rm(temporaryDirectory, { recursive: true, force: true });

  return thumbnailBuffer;
}

/**
 * Upload a video file AND its generated thumbnail, returning both paths
 * that should be stored in the database.
 *
 * - Filesystem mode:
 *   videoPath: "uploads/<timestamp>_<filename>"
 *   thumbnailPath: "thumbnails/<timestamp>_<basename>.jpg"
 *
 * - MinIO mode:
 *   Same object keys, but stored in the configured bucket.
 */
export async function uploadVideoWithThumbnail(
  originalFileName: string,
  fileBuffer: Buffer,
): Promise<{ videoPath: string; thumbnailPath: string }> {
  const cleanedFileName: string = originalFileName.replace(/\s+/g, '_');
  const baseNameWithoutExtension: string = path.basename(
    cleanedFileName,
    path.extname(cleanedFileName),
  );
  const timestamp: number = Date.now();

  const videoObjectKey: string = `uploads/${timestamp}_${cleanedFileName}`;
  const thumbnailObjectKey: string = `thumbnails/${timestamp}_${baseNameWithoutExtension}.jpg`;

  const thumbnailBuffer: Buffer = await generateThumbnailBuffer(
    originalFileName,
    fileBuffer,
  );

  if (videoStorageMode === 'filesystem') {
    const mediaDirectory: string = process.env.MEDIA_DIRECTORY || './media';
    const uploadsDirectoryPath: string = path.join(mediaDirectory, 'uploads');
    const thumbnailsDirectoryPath: string = path.join(
      mediaDirectory,
      'thumbnails',
    );

    if (!fs.existsSync(uploadsDirectoryPath)) {
      fs.mkdirSync(uploadsDirectoryPath, { recursive: true });
    }

    if (!fs.existsSync(thumbnailsDirectoryPath)) {
      fs.mkdirSync(thumbnailsDirectoryPath, { recursive: true });
    }

    const fullVideoFilePath: string = path.join(mediaDirectory, videoObjectKey);
    const fullThumbnailFilePath: string = path.join(
      mediaDirectory,
      thumbnailObjectKey,
    );

    await fs.promises.writeFile(fullVideoFilePath, fileBuffer);
    await fs.promises.writeFile(fullThumbnailFilePath, thumbnailBuffer);

    return {
      videoPath: videoObjectKey,
      thumbnailPath: thumbnailObjectKey,
    };
  }

  // MinIO mode
  if (!minioClient || !minioBucketName) {
    throw new Error('MinIO client is not configured');
  }

  await minioClient.putObject(minioBucketName, videoObjectKey, fileBuffer);
  await minioClient.putObject(
    minioBucketName,
    thumbnailObjectKey,
    thumbnailBuffer,
  );

  return {
    videoPath: videoObjectKey,
    thumbnailPath: thumbnailObjectKey,
  };
}
