import { Router } from 'express';
import fs from 'fs';
import path from 'path';

export const videoRouter = Router();

videoRouter.get('/:videoId/stream', (request, response) => {
  try {
    const mediaDirectory = process.env.MEDIA_DIRECTORY || './media';

    const sampleVideoFileName = 'sample.mp4';
    const videoFilePath = path.join(mediaDirectory, sampleVideoFileName);

    if (!fs.existsSync(videoFilePath)) {
      response.status(404).json({ error: 'Video file not found on server' });
      return;
    }
    const rangeHeader = request.headers.range;

    if (!rangeHeader) {
      response.status(400).send('Range header is required');
      return;
    }

    const videoFileStat = fs.statSync(videoFilePath);
    const videoFileSize = videoFileStat.size;

    const bytesPrefix = 'bytes=';
    // Example Range header: "bytes=0-" or "bytes=1000-2000"
    if (!rangeHeader.startsWith(bytesPrefix)) {
      response.status(400).send('Invalid Range header format');
      return;
    }

    const rangeParts = rangeHeader.replace(bytesPrefix, '');
    const [startString, endString] = rangeParts.split('-');

    const startByte = Number(startString);
    const chunkSize = 1_000_000; //1 mb chunks

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
          `Request range not satisfiable: ${startByte}-${endByte}/${videoFileSize}`,
        );
      return;
    }

    const contentLength = endByte - startByte + 1;

    response.writeHead(206, {
      'content-range': `bytes ${startByte}-${endByte}/${videoFileSize}`,
      'accept-ranges': `bytes`,
      'content-length': contentLength,
      'content-type': 'video/mp4',
    });

    const videoReadStream = fs.createReadStream(videoFilePath, {
      start: startByte,
      end: endByte,
    });

    videoReadStream
      .on('open', () => {
        videoReadStream.pipe(response).on('error', (error) => {
          console.error('Unexpected error during video streaming pipe', error);
        });
      })
      .on('error', (streamError) => {
        console.error('Unexpected error while video streaming', streamError);
      });
  } catch (error) {
    console.error('Unexpected error while handling video stream', error);
    response.sendStatus(500);
  }
});
