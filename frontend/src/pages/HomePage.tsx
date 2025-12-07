import { use, useEffect, useState } from 'react';
import type { VideoSummary } from '../types/video';
import { fetchVideoList } from '../api/videoApi';
import { VideoCard } from '../components/VideoCard';
import {
  fetchMyList,
  fetchWatchHistory,
  type WatchHistoryItem,
} from '../api/userVideoApi';
import { useAuth } from '../auth/AuthContext';

export function HomePage() {
  const [videoList, setVideoList] = useState<VideoSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [myListVideos, setMyListVideos] = useState<VideoSummary[]>([]);
  const [watchHistoryItems, setWatchHistoryItems] = useState<
    WatchHistoryItem[]
  >([]);

  const { user, token } = useAuth();

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

  // Load My List and watch history for authenticated user
  useEffect(() => {
    if (!user || !token) {
      setMyListVideos([]);
      setWatchHistoryItems([]);
      return;
    }

    async function loadUserSections() {
      try {
        const [listData, historyData] = await Promise.all([
          fetchMyList(token!),
          fetchWatchHistory(token!),
        ]);
        setMyListVideos(listData);
        setWatchHistoryItems(historyData);
      } catch (error) {
        console.error('Failed to fetch user-specific sections', error);
      }
    }

    loadUserSections();
  }, [user, token]);

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
      {user && watchHistoryItems.length > 0 && (
        <section style={{ marginBottom: '2rem' }}>
          <h2>Continue Watching</h2>
          <div className="video-grid">
            {watchHistoryItems.map((item) => (
              <VideoCard
                key={item.videoId}
                video={{
                  id: item.videoId,
                  title: item.title,
                  thumbnailUrl: item.thumbnailUrl,
                  genres: item.genres,
                }}
              />
            ))}
          </div>
        </section>
      )}

      {user && myListVideos.length > 0 && (
        <section style={{ marginBottom: '2rem' }}>
          <h2>My List</h2>
          <div className="video-grid">
            {myListVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2>Browse</h2>
        {videoList.length === 0 ? (
          <div>No videos are available yet.</div>
        ) : (
          <div className="video-grid">
            {videoList.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
