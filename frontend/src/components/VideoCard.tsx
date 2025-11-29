import { Link } from 'react-router-dom';
import type { VideoSummary } from '../types/video';

interface VideoCardProps {
  video: VideoSummary;
}

export function VideoCard({ video }: VideoCardProps) {
  return (
    <Link to={`/video/${video.id}`}>
      <div>
        {video.thumbnailUrl ? (
          <img src={video.thumbnailUrl} alt={video.title} />
        ) : (
          <div> No Thumbnail</div>
        )}
      </div>
      <div>
        <h3>{video.title}</h3>
        {video.genres.length > 0 && <p>{video.genres.join(', ')}</p>}
      </div>
    </Link>
  );
}
