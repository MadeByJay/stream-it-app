import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { requireAdmin } from '../middleware/adminMiddleware';
import {
  getAllVideos,
  getVideoById,
  createVideo,
  updateVideo,
  deleteVideo,
} from '../modules/videos/videoRepository';

export const adminVideoRouter: Router = Router();

adminVideoRouter.use(requireAuth, requireAdmin);

/**
 * GET /api/admin/videos
 * Return full video records for admin management.
 */
adminVideoRouter.get('/', async (request: Request, response: Response) => {
  try {
    const videoRecords = await getAllVideos();
    response.json(videoRecords);
  } catch (error) {
    console.error('Error fetching admin video list', error);
    response.status(500).json({ error: 'Failed to fetch videos for admin' });
  }
});

/**
 * GET /api/admin/videos/:videoId
 */
adminVideoRouter.get(
  '/:videoId',
  async (request: Request, response: Response) => {
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

      response.json(videoRecord);
    } catch (error) {
      console.error('Error fetching admin video detail', error);
      response.status(500).json({ error: 'Failed to fetch video' });
    }
  },
);

/**
 * POST /api/admin/videos
 * Body: { title, description?, thumbnailUrl?, videoPath, releaseYear?, ageRating?, genreIds? }
 */
adminVideoRouter.post('/', async (request: Request, response: Response) => {
  try {
    const {
      title,
      description,
      thumbnailUrl,
      videoPath,
      releaseYear,
      ageRating,
      genreIds,
    } = request.body as {
      title?: string;
      description?: string | null;
      thumbnailUrl?: string | null;
      videoPath?: string;
      releaseYear?: number | null;
      ageRating?: string | null;
      genreIds?: number[];
    };

    if (!title || !videoPath) {
      response.status(400).json({ error: 'title and videoPath are required' });
      return;
    }

    const createdVideo = await createVideo({
      title,
      description,
      thumbnailUrl,
      videoPath,
      releaseYear,
      ageRating,
      genreIdentifiers: genreIds ?? [],
    });

    response.status(201).json(createdVideo);
  } catch (error) {
    console.error('Error creating video', error);
    response.status(500).json({ error: 'Failed to create video' });
  }
});

/**
 * PATCH /api/admin/videos/:videoId
 */
adminVideoRouter.patch(
  '/:videoId',
  async (request: Request, response: Response) => {
    try {
      const videoIdentifier = Number(request.params.videoId);

      if (Number.isNaN(videoIdentifier)) {
        response.status(400).json({ error: 'Invalid video identifier' });
        return;
      }

      const {
        title,
        description,
        thumbnailUrl,
        videoPath,
        releaseYear,
        ageRating,
        genreIds,
      } = request.body as {
        title?: string;
        description?: string | null;
        thumbnailUrl?: string | null;
        videoPath?: string;
        releaseYear?: number | null;
        ageRating?: string | null;
        genreIds?: number[];
      };

      const updatedVideo = await updateVideo(videoIdentifier, {
        title,
        description,
        thumbnailUrl,
        videoPath,
        releaseYear,
        ageRating,
        genreIdentifiers: genreIds,
      });

      if (!updatedVideo) {
        response.status(404).json({ error: 'Video not found' });
        return;
      }

      response.json(updatedVideo);
    } catch (error) {
      console.error('Error updating video', error);
      response.status(500).json({ error: 'Failed to update video' });
    }
  },
);

/**
 * DELETE /api/admin/videos/:videoId
 */
adminVideoRouter.delete(
  '/:videoId',
  async (request: Request, response: Response) => {
    try {
      const videoIdentifier = Number(request.params.videoId);

      if (Number.isNaN(videoIdentifier)) {
        response.status(400).json({ error: 'Invalid video identifier' });
        return;
      }

      await deleteVideo(videoIdentifier);
      response.status(204).send();
    } catch (error) {
      console.error('Error deleting video', error);
      response.status(500).json({ error: 'Failed to delete video' });
    }
  },
);
