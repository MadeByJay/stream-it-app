import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { databasePool } from '../db/databasePool';

export const meRouter: Router = Router();

// All routes in this router require auth
meRouter.use(requireAuth);

//TODO move query logic into a Repository
/**
 * GET /api/me/list
 */
meRouter.get('/list', async (request: Request, response: Response) => {
  try {
    const userId = request.userId!;
    const queryText = `
      SELECT
        v.id,
        v.title,
        v.thumbnail_url,
        COALESCE(
          json_agg(g.name) FILTER (WHERE g.id IS NOT NULL),
          '[]'
        ) AS genres
      FROM user_list ul
      JOIN videos v ON v.id = ul.video_id
      LEFT JOIN video_genres vg ON vg.video_id = v.id
      LEFT JOIN genres g ON g.id = vg.genre_id
      WHERE ul.user_id = $1
      GROUP BY v.id
      ORDER BY v.id;
    `;
    const queryResult = await databasePool.query(queryText, [userId]);

    const videos = queryResult.rows.map((row) => ({
      id: row.id,
      title: row.title,
      thumbnailUrl: row.thumbnail_url,
      genres: row.genres ?? [],
    }));

    response.json(videos);
  } catch (error) {
    console.error('Error fetching user list', error);
    response.status(500).json({ error: 'Failed to fetch My List' });
  }
});

/**
 * POST /api/me/list/:videoId
 */
meRouter.post(
  '/list/:videoId',
  async (request: Request, response: Response) => {
    try {
      const userId = request.userId!;
      const videoId = Number(request.params.videoId);

      if (Number.isNaN(videoId)) {
        response.status(400).json({ error: 'Invalid video identifier' });
        return;
      }

      await databasePool.query(
        `
        INSERT INTO user_list (user_id, video_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, video_id) DO NOTHING
      `,
        [userId, videoId],
      );

      response.status(201).json({ status: 'added' });
    } catch (error) {
      console.error('Error adding to user list', error);
      response.status(500).json({ error: 'Failed to add to My List' });
    }
  },
);

/**
 * DELETE /api/me/list/:videoId
 */
meRouter.delete(
  '/list/:videoId',
  async (request: Request, response: Response) => {
    try {
      const userId = request.userId!;
      const videoId = Number(request.params.videoId);

      if (Number.isNaN(videoId)) {
        response.status(400).json({ error: 'Invalid video identifier' });
        return;
      }

      await databasePool.query(
        `
        DELETE FROM user_list
        WHERE user_id = $1 AND video_id = $2
      `,
        [userId, videoId],
      );

      response.json({ status: 'removed' });
    } catch (error) {
      console.error('Error removing from user list', error);
      response.status(500).json({ error: 'Failed to remove from My List' });
    }
  },
);

/**
 * GET /api/me/watch-history
 */
meRouter.get('/watch-history', async (request: Request, response: Response) => {
  try {
    const userId = request.userId!;

    const queryText = `
      SELECT
        v.id,
        v.title,
        v.thumbnail_url,
        wh.last_position_seconds,
        wh.updated_at,
        COALESCE(
          json_agg(g.name) FILTER (WHERE g.id IS NOT NULL),
          '[]'
        ) AS genres
      FROM watch_history wh
      JOIN videos v ON v.id = wh.video_id
      LEFT JOIN video_genres vg ON vg.video_id = v.id
      LEFT JOIN genres g ON g.id = vg.genre_id
      WHERE wh.user_id = $1
      GROUP BY v.id, wh.last_position_seconds, wh.updated_at
      ORDER BY wh.updated_at DESC
      LIMIT 20;
    `;

    const queryResult = await databasePool.query(queryText, [userId]);

    const items = queryResult.rows.map((row) => ({
      videoId: row.id,
      title: row.title,
      thumbnailUrl: row.thumbnail_url,
      genres: row.genres ?? [],
      lastPositionSeconds: row.last_position_seconds,
      updatedAt: row.updated_at,
    }));

    response.json(items);
  } catch (error) {
    console.error('Error fetching watch history', error);
    response.status(500).json({ error: 'Failed to fetch watch history' });
  }
});

/**
 * POST /api/me/watch-history
 * Body: { videoId, lastPositionSeconds }
 */
meRouter.post(
  '/watch-history',
  async (request: Request, response: Response) => {
    try {
      const userId = request.userId!;
      const { videoId, lastPositionSeconds } = request.body as {
        videoId?: number;
        lastPositionSeconds?: number;
      };

      if (!videoId || typeof lastPositionSeconds !== 'number') {
        response
          .status(400)
          .json({ error: 'videoId and lastPositionSeconds are required' });
        return;
      }

      await databasePool.query(
        `
        INSERT INTO watch_history (user_id, video_id, last_position_seconds, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (user_id, video_id)
        DO UPDATE SET
          last_position_seconds = EXCLUDED.last_position_seconds,
          updated_at = NOW()
      `,
        [userId, videoId, lastPositionSeconds],
      );

      response.json({ status: 'updated' });
    } catch (error) {
      console.error('Error updating watch history', error);
      response.status(500).json({ error: 'Failed to update watch history' });
    }
  },
);
