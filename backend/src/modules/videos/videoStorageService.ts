import dotenv from 'dotenv';
import { Client as MinioClient } from 'minio';
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

/**
 * Return the URL the frontend should use in <video src={streamUrl}>.
 *
 * In filesystem mode, this is /api/videos/:id/stream
 * In MinIO mode, this is a presigned GET URL for the object's key
 * stored in videoRecord.videoPath
 */
export async function getVideoStreamUrl(
  videoRecord: VideoRecord,
): Promise<string> {
  if (videoStorageMode === 'filesystem') {
    return `/api/videos/${videoRecord.id}/stream`;
  }

  // MinIO mode
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
 * Helper so other modules can know what the current video storage mode is
 */
export function getVideoStorageMode(): VideoStorageMode {
  return videoStorageMode;
}
