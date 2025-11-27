import { databasePool } from '../../db/databasePool';
export interface VideoRecord {
  id: number;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  videoPath: string;
  releaseYear: number | null;
  ageRating: string | null;
  genres: string[];
}

function mapVideoRowToVideoRecord(row: any): VideoRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    thumbnailUrl: row.thumbnail_url,
    videoPath: row.video_path,
    releaseYear: row.release_year,
    ageRating: row.age_rating,
    genres: row.genres ?? [],
  };
}

export async function getAllVideos(): Promise<VideoRecord[]> {
  const queryText = `
    SELECT
      v.id,
      v.title,
      v.description,
      v.thumbnail_url,
      v.video_path,
      v.release_year,
      v.age_rating,
      COALESCE(
        json_agg(g.name) FILTER (WHERE g.id IS NOT NULL),
        '[]'
      ) AS genres
    FROM videos v
    LEFT JOIN video_genres vg ON vg.video_id = v.id
    LEFT JOIN genres g ON g.id = vg.genre_id
    GROUP BY v.id
    ORDER BY v.id;
  `;

  const queryResult = await databasePool.query(queryText);

  return queryResult.rows.map(mapVideoRowToVideoRecord);
}

/**
 * Fetch a single video by identifier, including genres.
 */
export async function getVideoById(
  videoId: number,
): Promise<VideoRecord | null> {
  const queryText = `
    SELECT
      v.id,
      v.title,
      v.description,
      v.thumbnail_url,
      v.video_path,
      v.release_year,
      v.age_rating,
      COALESCE(
        json_agg(g.name) FILTER (WHERE g.id IS NOT NULL),
        '[]'
      ) AS genres
    FROM videos v
    LEFT JOIN video_genres vg ON vg.video_id = v.id
    LEFT JOIN genres g ON g.id = vg.genre_id
    WHERE v.id = $1
    GROUP BY v.id;
  `;

  const queryResult = await databasePool.query(queryText, [videoId]);

  if (queryResult.rows.length === 0) {
    return null;
  }

  return mapVideoRowToVideoRecord(queryResult.rows[0]);
}
