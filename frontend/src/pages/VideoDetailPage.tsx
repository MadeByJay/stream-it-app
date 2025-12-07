import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { VideoDetail } from '../types/video';
import { fetchVideoDetail, fetchVideoList } from '../api/videoApi';
import { useAuth } from '../auth/AuthContext';
import { addVideoToMyList, removeVideoFromMyList } from '../api/userVideoApi';

export function VideoDetailPage() {
  const { videoId } = useParams<{ videoId: string }>();

  const [videoDetail, setVideoDetail] = useState<VideoDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isInMyList, setIsInMyList] = useState<boolean>(false);
  const [isUpdatingList, setIsUpdatingList] = useState<boolean>(false);

  const { user, token } = useAuth();

  useEffect(() => {
    async function loadVideoDetail() {
      if (!videoId) {
        setErrorMessage('Invalid video identifier');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const parsedVideoIdentifier = Number(videoId);
        const detail = await fetchVideoDetail(parsedVideoIdentifier);
        setVideoDetail(detail);
        setErrorMessage(null);
      } catch (error) {
        console.error('Failed to fetch video details', error);
        setErrorMessage('Failed to load video details');
      } finally {
        setIsLoading(false);
      }
    }

    loadVideoDetail();
  }, [videoId]);

  if (isLoading) {
    return <div>Loading video...</div>;
  }
  if (errorMessage) {
    return <div>{errorMessage}</div>;
  }

  if (!videoDetail) {
    return <div>Video not found</div>;
  }

  // Simple client-side My List state tracking:
  async function handleToggleMyList() {
    if (!user || !token || !videoDetail) {
      return;
    }

    try {
      setIsUpdatingList(true);
      if (isInMyList) {
        await removeVideoFromMyList(token, videoDetail.id);
        setIsInMyList(false);
      } else {
        await addVideoToMyList(token, videoDetail.id);
        setIsInMyList(true);
      }
    } catch (error) {
      console.error('Failed to update My List', error);
    } finally {
      setIsUpdatingList(false);
    }
  }

  return (
    <div className="video-detail-page">
      <h2>{videoDetail.title}</h2>
      {videoDetail.thumbnailUrl && (
        <img
          src={videoDetail.thumbnailUrl}
          alt={videoDetail.title}
          className="video-detail-thumbnail"
        />
      )}

      {videoDetail.genres.length > 0 && (
        <p>
          <strong>Genres:</strong> {videoDetail.genres.join(', ')}
        </p>
      )}

      {videoDetail.releaseYear && (
        <p>
          <strong>Year:</strong> {videoDetail.releaseYear}
        </p>
      )}

      {videoDetail.ageRating && (
        <p>
          <strong>Rating:</strong> {videoDetail.ageRating}
        </p>
      )}

      {videoDetail.description && <p>{videoDetail.description}</p>}

      <div className="video-detail-actions">
        <Link to={`/watch/${videoDetail.id}`} className="play-button">
          Play
        </Link>

        {user && (
          <button
            type="button"
            onClick={handleToggleMyList}
            disabled={isUpdatingList}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '999px',
              border: 'none',
              backgroundColor: '#333',
              color: '#fff',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            {isUpdatingList
              ? 'Updating...'
              : isInMyList
                ? 'Remove from My List'
                : 'Add to My List'}
          </button>
        )}

        <Link to="/">Back to home</Link>
      </div>
    </div>
  );
}
