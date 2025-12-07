import type { VideoSummary } from '../types/video';

async function handleJsonResponse<ResponseType>(
  response: Response,
): Promise<ResponseType> {
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Request failed with status ${response.status}: ${errorBody || response.statusText}`,
    );
  }
  return (await response.json()) as ResponseType;
}

export interface WatchHistoryItem {
  videoId: number;
  title: string;
  thumbnailUrl: string | null;
  genres: string[];
  lastPositionSeconds: number;
  updatedAt: string;
}

export async function fetchMyList(token: string): Promise<VideoSummary[]> {
  const response = await fetch('/api/me/list', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleJsonResponse<VideoSummary[]>(response);
}

export async function addVideoToMyList(
  token: string,
  videoId: number,
): Promise<{ status: string }> {
  const response = await fetch(`/api/me/list/${videoId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleJsonResponse<{ status: string }>(response);
}

export async function removeVideoFromMyList(
  token: string,
  videoId: number,
): Promise<{ status: string }> {
  const response = await fetch(`/api/me/list/${videoId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleJsonResponse<{ status: string }>(response);
}

export async function fetchWatchHistory(
  token: string,
): Promise<WatchHistoryItem[]> {
  const response = await fetch('/api/me/watch-history', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleJsonResponse<WatchHistoryItem[]>(response);
}

export async function updateWatchHistory(
  token: string,
  videoId: number,
  lastPositionSeconds: number,
): Promise<{ status: string }> {
  const response = await fetch('/api/me/watch-history', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ videoId, lastPositionSeconds }),
  });
  return handleJsonResponse<{ status: string }>(response);
}
