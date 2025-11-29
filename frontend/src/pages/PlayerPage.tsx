import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchVideoDetail } from '../api/videoApi';
import type { VideoDetail } from '../types/video';

export function PlayerPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

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

  const streamUrl = videoDetail.streamUrl;

  return (
    <div>
      <h2>{videoDetail.title}</h2>

      <video
        ref={videoElementRef}
        src={streamUrl}
        controls
        autoPlay
        style={{ width: '100%', maxWidth: '960px' }}
      >
        Your browser does not support HTML5 video
      </video>

      <div>
        <Link to={`/video/${videoDetail}`}>Back to details</Link>
        <span style={{ marginLeft: '1rem' }}>
          <Link to={'/'}>Back to home</Link>
        </span>
      </div>
    </div>
  );
}
