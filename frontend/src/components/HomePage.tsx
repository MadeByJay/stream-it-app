import { use, useEffect, useState } from 'react';
import type { VideoSummary } from '../types/video';
import { fetchVideoList } from '../api/videoApi';
import { VideoCard } from './VideoCard';

export function HomePage() {
  const [videoList, setVideoList] = useState<VideoSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadVideos() {
      try {
        setIsLoading(true);
        const videos = await fetchVideoList();
        console.log(videos);
        setVideoList(videos);
        setErrorMessage(null);
      } catch (error) {
        console.error('Failed to fetch videos', error);
        setErrorMessage('Failed to load videos');
      } finally {
        setIsLoading(false);
      }
    }

    loadVideos();
  }, []);

  if (isLoading) {
    return <div>Loading videos...</div>;
  }

  if (errorMessage) {
    return <div>{errorMessage}</div>;
  }

  if (videoList.length === 0) {
    return <div>No videos are available yet</div>;
  }

  return (
    <div>
      <h2>Browse</h2>
      <div>
        {videoList.map((video) => {
          return <VideoCard key={video.id} video={video} />;
        })}
      </div>
    </div>
  );
}
