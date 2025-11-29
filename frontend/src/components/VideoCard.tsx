import { Link } from 'react-router-dom';
import type { VideoSummary } from '../types/video';

interface VideoCardProps {
  video: VideoSummary;
}

export function VideoCard({ video }: VideoCardProps) {
  return (
    <Link to={`/video/${video.id}`} className="video-card">
      <div className="video-card-thumbnail">
        {video.thumbnailUrl ? (
          <img src={video.thumbnailUrl} alt={video.title} />
        ) : (
          <div className="video-card-thumbnail-placeholder"> No Thumbnail</div>
        )}
      </div>
      <div className="video-card-body">
        <h3 className="video-card-title">{video.title}</h3>
        {video.genres.length > 0 && (
          <p className="video-card-genres">{video.genres.join(', ')}</p>
        )}
      </div>
    </Link>
  );
}
