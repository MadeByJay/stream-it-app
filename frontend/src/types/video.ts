export interface VideoSummary {
  id: number;
  title: string;
  thumbnailUrl: string | null;
  genres: string[];
}

export interface VideoDetail {
  id: number;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  genres: string[];
  releaseYear: number | null;
  ageRating: string | null;
  streamUrl: string;
}

export interface AdminVideo {
  id: number;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  videoPath: string;
  releaseYear: number | null;
  ageRating: string | null;
  genres: string[];
}
