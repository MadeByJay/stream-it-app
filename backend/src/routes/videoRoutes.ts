import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { getAllVideos, getVideoById } from '../modules/videos/videoRepository';
import {
  getVideoStorageMode,
  getVideoStreamUrl,
} from '../modules/videos/videoStorageService';

export const videoRouter: Router = Router();

/**
 * GET /api/videos
 * Return a list of videos for the catalog.
 */
videoRouter.get('/', async (request: Request, response: Response) => {
  try {
    const videoRecords = await getAllVideos();

    const videoSummaries = videoRecords.map((videoRecord) => ({
      id: videoRecord.id,
      title: videoRecord.title,
      thumbnailUrl: videoRecord.thumbnailUrl,
      genres: videoRecord.genres,
    }));

    response.json(videoSummaries);
  } catch (error) {
    console.error('Error fetching videos', error);
    response.status(500).json({ error: 'Failed to fetch videos' });
  }
});

/**
 * GET /api/videos/:videoId
 * Return detailed information about a single video, including a stream URL
 * that the frontend can use for the <video> tag.
 */
videoRouter.get('/:videoId', async (request: Request, response: Response) => {
  try {
    const videoIdentifier = Number(request.params.videoId);

    if (Number.isNaN(videoIdentifier)) {
      response.status(400).json({ error: 'Invalid video identifier' });
      return;
    }

    const videoRecord = await getVideoById(videoIdentifier);

    if (!videoRecord) {
      response.status(404).json({ error: 'Video not found' });
      return;
    }

    const streamUrl = await getVideoStreamUrl(videoRecord);

    response.json({
      id: videoRecord.id,
      title: videoRecord.title,
      description: videoRecord.description,
      thumbnailUrl: videoRecord.thumbnailUrl,
      genres: videoRecord.genres,
      releaseYear: videoRecord.releaseYear,
      ageRating: videoRecord.ageRating,
      streamUrl,
    });
  } catch (error) {
    console.error('Error fetching video by identifier', error);
    response.status(500).json({ error: 'Failed to fetch video' });
  }
});

/**
 * GET /api/videos/:videoId/stream
 * Filesystem-only streaming endpoint.
 * In MinIO mode, the frontend should use the MinIO presigned URL instead.
 */
videoRouter.get(
  '/:videoId/stream',
  async (request: Request, response: Response) => {
    try {
      const storageMode = getVideoStorageMode();

      if (storageMode === 'minio') {
        response.status(400).json({
          error:
            'Streaming via /stream is not available in MinIO mode. Use streamUrl.',
        });
        return;
      }

      const mediaDirectory: string = process.env.MEDIA_DIRECTORY || './media';
      const videoIdentifier = Number(request.params.videoId);

      if (Number.isNaN(videoIdentifier)) {
        response.status(400).json({ error: 'Invalid video identifier' });
        return;
      }

      const videoRecord = await getVideoById(videoIdentifier);

      if (!videoRecord) {
        response.status(404).json({ error: 'Video not found' });
        return;
      }

      const videoFilePath: string = path.join(
        mediaDirectory,
        videoRecord.videoPath,
      );

      if (!fs.existsSync(videoFilePath)) {
        response.status(404).json({ error: 'Video file not found on server' });
        return;
      }

      const rangeHeader: string | undefined = request.headers.range;

      if (!rangeHeader) {
        response.status(400).send('Range header is required');
        return;
      }

      const videoFileStat = fs.statSync(videoFilePath);
      const videoFileSize: number = videoFileStat.size;

      const bytesPrefix: string = 'bytes=';

      if (!rangeHeader.startsWith(bytesPrefix)) {
        response.status(400).send('Invalid Range header format');
        return;
      }

      const rangeParts: string = rangeHeader.replace(bytesPrefix, '');
      const [startString, endString] = rangeParts.split('-');

      const startByte: number = Number(startString);
      const chunkSize: number = 1_000_000; // 1 MB

      let endByte: number;

      if (endString) {
        endByte = Number(endString);
      } else {
        endByte = Math.min(startByte + chunkSize, videoFileSize - 1);
      }

      if (startByte >= videoFileSize || endByte >= videoFileSize) {
        response
          .status(416)
          .send(
            `Requested Range Not Satisfiable: ${startByte}-${endByte}/${videoFileSize}`,
          );
        return;
      }

      const contentLength: number = endByte - startByte + 1;

      response.writeHead(206, {
        'Content-Range': `bytes ${startByte}-${endByte}/${videoFileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': contentLength,
        'Content-Type': 'video/mp4',
      });

      const videoReadStream = fs.createReadStream(videoFilePath, {
        start: startByte,
        end: endByte,
      });

      videoReadStream.on('open', () => {
        videoReadStream.pipe(response);
      });

      videoReadStream.on('error', (streamError) => {
        console.error('Error while streaming video', streamError);
        response.sendStatus(500);
      });
    } catch (error) {
      console.error('Unexpected error while handling video stream', error);
      response.sendStatus(500);
    }
  },
);
