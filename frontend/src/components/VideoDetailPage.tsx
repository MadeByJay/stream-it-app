import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { VideoDetail } from '../types/video';
import { fetchVideoDetail, fetchVideoList } from '../api/videoApi';

export function VideoDetailPage() {
  const { videoId } = useParams<{ videoId: string }>();

  const [videoDetail, setVideoDetail] = useState<VideoDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  return (
    <div>
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

      <div>
        <Link to={`/watch/${videoDetail.id}`}>Play</Link>
        <Link to={'/'}>Back to Home</Link>
      </div>
    </div>
  );
}
