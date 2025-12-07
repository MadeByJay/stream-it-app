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
 * Fetch a single video by identifier including genres.
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

/**
 * Create a new video record.
 * genreIdentifiers can be empty
 * caller can choose to associate genres or not.
 */
export async function createVideo(params: {
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  videoPath: string;
  releaseYear?: number | null;
  ageRating?: string | null;
  genreIdentifiers?: number[];
}): Promise<VideoRecord> {
  const {
    title,
    description = null,
    thumbnailUrl = null,
    videoPath,
    releaseYear = null,
    ageRating = null,
    genreIdentifiers = [],
  } = params;

  const insertVideoQuery = `
    INSERT INTO videos (title, description, thumbnail_url, video_path, release_year, age_rating)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, title, description, thumbnail_url, video_path, release_year, age_rating
  `;

  const insertResult = await databasePool.query(insertVideoQuery, [
    title,
    description,
    thumbnailUrl,
    videoPath,
    releaseYear,
    ageRating,
  ]);

  const insertedRow = insertResult.rows[0];

  // Insert video_genres if provided
  if (genreIdentifiers.length > 0) {
    const insertGenresQuery = `
      INSERT INTO video_genres (video_id, genre_id)
      SELECT $1, genre_id
      FROM unnest($2::int[]) AS genre_id
      ON CONFLICT (video_id, genre_id) DO NOTHING
    `;
    await databasePool.query(insertGenresQuery, [
      insertedRow.id,
      genreIdentifiers,
    ]);
  }

  const fullVideo = await getVideoById(insertedRow.id);

  if (!fullVideo) {
    throw new Error('Failed to fetch inserted video');
  }

  return fullVideo;
}

/**
 * Update an existing video record with partial fields.
 * This does NOT change genres
 * That could be managed separately if needed.
 */
export async function updateVideo(
  videoIdentifier: number,
  fieldsToUpdate: {
    title?: string;
    description?: string | null;
    thumbnailUrl?: string | null;
    videoPath?: string;
    releaseYear?: number | null;
    ageRating?: string | null;
    genreIdentifiers?: number[];
  },
): Promise<VideoRecord | null> {
  const updateColumns: string[] = [];
  const values: any[] = [];
  let parameterIndex = 1;

  if (fieldsToUpdate.title !== undefined) {
    updateColumns.push(`title = $${parameterIndex++}`);
    values.push(fieldsToUpdate.title);
  }
  if (fieldsToUpdate.description !== undefined) {
    updateColumns.push(`description = $${parameterIndex++}`);
    values.push(fieldsToUpdate.description);
  }
  if (fieldsToUpdate.thumbnailUrl !== undefined) {
    updateColumns.push(`thumbnail_url = $${parameterIndex++}`);
    values.push(fieldsToUpdate.thumbnailUrl);
  }
  if (fieldsToUpdate.videoPath !== undefined) {
    updateColumns.push(`video_path = $${parameterIndex++}`);
    values.push(fieldsToUpdate.videoPath);
  }
  if (fieldsToUpdate.releaseYear !== undefined) {
    updateColumns.push(`release_year = $${parameterIndex++}`);
    values.push(fieldsToUpdate.releaseYear);
  }
  if (fieldsToUpdate.ageRating !== undefined) {
    updateColumns.push(`age_rating = $${parameterIndex++}`);
    values.push(fieldsToUpdate.ageRating);
  }

  if (updateColumns.length > 0) {
    const updateQuery = `
      UPDATE videos
      SET ${updateColumns.join(', ')}
      WHERE id = $${parameterIndex}
      RETURNING id
    `;
    values.push(videoIdentifier);

    const updateResult = await databasePool.query(updateQuery, values);
    if (updateResult.rows.length === 0) {
      return null;
    }
  }

  if (fieldsToUpdate.genreIdentifiers) {
    const genreIdentifiers = fieldsToUpdate.genreIdentifiers;

    // Remove existing mappings and insert new ones
    await databasePool.query('DELETE FROM video_genres WHERE video_id = $1', [
      videoIdentifier,
    ]);

    if (genreIdentifiers.length > 0) {
      const insertGenresQuery = `
        INSERT INTO video_genres (video_id, genre_id)
        SELECT $1, genre_id
        FROM unnest($2::int[]) AS genre_id
        ON CONFLICT (video_id, genre_id) DO NOTHING
      `;
      await databasePool.query(insertGenresQuery, [
        videoIdentifier,
        genreIdentifiers,
      ]);
    }
  }

  const updatedVideo = await getVideoById(videoIdentifier);
  return updatedVideo;
}

/**
 * Delete a video and all related rows (via ON DELETE CASCADE).
 */
export async function deleteVideo(videoIdentifier: number): Promise<void> {
  await databasePool.query('DELETE FROM videos WHERE id = $1', [
    videoIdentifier,
  ]);
}
