import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import type { AdminVideo } from '../../types/video';
import {
  createAdminVideo,
  fetchAdminVideoDetail,
  updateAdminVideo,
} from '../../api/adminVideosApi';

export function AdminVideoFormPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const isEditMode = Boolean(videoId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState<string>('');
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [videoPath, setVideoPath] = useState<string>('');
  const [releaseYear, setReleaseYear] = useState<string>('');
  const [ageRating, setAgeRating] = useState<string>('');
  const [genreIdentifiersText, setGenreIdentifiersText] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditMode || !videoId || !token) {
      return;
    }

    async function loadVideo() {
      try {
        setIsLoading(true);
        const parsedVideoIdentifier = Number(videoId);
        const adminVideo: AdminVideo = await fetchAdminVideoDetail(
          token!,
          parsedVideoIdentifier,
        );

        setTitle(adminVideo.title);
        setDescription(adminVideo.description ?? '');
        setThumbnailUrl(adminVideo.thumbnailUrl ?? '');
        setVideoPath(adminVideo.videoPath);
        setReleaseYear(
          adminVideo.releaseYear ? String(adminVideo.releaseYear) : '',
        );
        setAgeRating(adminVideo.ageRating ?? '');
        // Represent genre identifiers as a comma-separated string if you want to use it later.
        setGenreIdentifiersText('');
      } catch (error) {
        console.error('Failed to load admin video', error);
        setErrorMessage('Failed to load video for editing.');
      } finally {
        setIsLoading(false);
      }
    }

    loadVideo();
  }, [isEditMode, videoId, token]);

  function parseGenreIdentifiers(input: string): number[] | undefined {
    const trimmed = input.trim();
    if (!trimmed) {
      return undefined;
    }
    const parts = trimmed.split(',').map((part) => part.trim());
    const identifiers: number[] = [];
    for (const part of parts) {
      const value = Number(part);
      if (!Number.isNaN(value)) {
        identifiers.push(value);
      }
    }
    return identifiers;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!token) {
      setErrorMessage('You must be logged in as an admin.');
      return;
    }

    if (!title || !videoPath) {
      setErrorMessage('Title and video path are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const parsedReleaseYear = releaseYear ? Number(releaseYear) : null;
      const genreIdentifiers = parseGenreIdentifiers(genreIdentifiersText);

      if (isEditMode && videoId) {
        const parsedVideoIdentifier = Number(videoId);
        await updateAdminVideo(token, parsedVideoIdentifier, {
          title,
          description: description || null,
          thumbnailUrl: thumbnailUrl || null,
          videoPath,
          releaseYear: parsedReleaseYear,
          ageRating: ageRating || null,
          genreIdentifiers,
        });
      } else {
        await createAdminVideo(token, {
          title,
          description: description || null,
          thumbnailUrl: thumbnailUrl || null,
          videoPath,
          releaseYear: parsedReleaseYear,
          ageRating: ageRating || null,
          genreIdentifiers,
        });
      }

      navigate('/admin/videos');
    } catch (error) {
      console.error('Failed to save admin video', error);
      setErrorMessage('Failed to save video. Check console for details.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!user || !user.isAdmin) {
    return <div>You must be an admin to view this page.</div>;
  }

  if (isLoading) {
    return <div>Loading video...</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2>{isEditMode ? 'Edit Video' : 'New Video'}</h2>
        <Link to="/admin/videos" className="admin-link-button">
          Back to list
        </Link>
      </div>

      {errorMessage && <div className="admin-error">{errorMessage}</div>}

      <form className="admin-form" onSubmit={handleSubmit}>
        <label>
          Title
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </label>

        <label>
          Description
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
          />
        </label>

        <label>
          Thumbnail URL
          <input
            type="text"
            value={thumbnailUrl}
            onChange={(event) => setThumbnailUrl(event.target.value)}
            placeholder="/static/thumbnails/sample.jpg"
          />
        </label>

        <label>
          Video Path
          <input
            type="text"
            value={videoPath}
            onChange={(event) => setVideoPath(event.target.value)}
            placeholder="sample.mp4"
            required
          />
        </label>

        <div className="admin-form-row">
          <label>
            Release Year
            <input
              type="number"
              value={releaseYear}
              onChange={(event) => setReleaseYear(event.target.value)}
              placeholder="2024"
            />
          </label>

          <label>
            Age Rating
            <input
              type="text"
              value={ageRating}
              onChange={(event) => setAgeRating(event.target.value)}
              placeholder="PG-13"
            />
          </label>
        </div>

        <label>
          Genre IDs (comma-separated, optional)
          <input
            type="text"
            value={genreIdentifiersText}
            onChange={(event) => setGenreIdentifiersText(event.target.value)}
            placeholder="1, 2, 3"
          />
        </label>

        <button
          type="submit"
          className="admin-primary-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Video'}
        </button>
      </form>
    </div>
  );
}
