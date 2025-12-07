import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchVideoDetail } from '../api/videoApi';
import type { VideoDetail } from '../types/video';
import { updateWatchHistory } from '../api/userVideoApi';
import { useAuth } from '../auth/AuthContext';

export function PlayerPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  const [videoDetail, setVideoDetail] = useState<VideoDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSavedPositionSeconds, setLastSavedPositionSeconds] =
    useState<number>(0);

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

  async function handleTimeUpdate() {
    if (!user || !token || !videoDetail || !videoElementRef.current) {
      return;
    }

    const currentPositionSeconds = Math.floor(
      videoElementRef.current.currentTime,
    );

    // Only send an update every 15 seconds of progress
    if (currentPositionSeconds - lastSavedPositionSeconds < 15) {
      return;
    }

    try {
      await updateWatchHistory(token, videoDetail.id, currentPositionSeconds);
      setLastSavedPositionSeconds(currentPositionSeconds);
    } catch (error) {
      console.error('Failed to update watch history', error);
    }
  }

  if (isLoading) {
    return <div>Loading video...</div>;
  }
  if (errorMessage) {
    return <div>{errorMessage}</div>;
  }

  if (!videoDetail) {
    return <div>Video not found</div>;
  }

  const streamUrl = videoDetail.streamUrl;

  return (
    <div className="player-page">
      <h2>{videoDetail.title}</h2>

      <video
        ref={videoElementRef}
        src={streamUrl}
        controls
        autoPlay
        style={{ width: '100%', maxWidth: '960px' }}
        onTimeUpdate={handleTimeUpdate}
      >
        Your browser does not support HTML5 video.
      </video>

      <div className="player-actions">
        <Link to={`/video/${videoDetail.id}`}>Back to details</Link>
        <span style={{ marginLeft: '1rem' }}>
          <Link to="/">Back to home</Link>
        </span>
      </div>
    </div>
  );
}
