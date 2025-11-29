import type { VideoDetail, VideoSummary } from '../types/video';

async function handleJsonResponse(response: Response) {
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Request failed with ${response.status}: ${errorBody || response.statusText} `,
    );
  }
  // return (await response.json()) as ResponseType;
  return await response.json();
}

export async function fetchVideoList(): Promise<VideoSummary[]> {
  const response = await fetch('/api/videos');
  return handleJsonResponse(response);
}

export async function fetchVideoDetail(
  videoIdentifier: number,
): Promise<VideoDetail> {
  const response = await fetch(`/api/videos/${videoIdentifier}`);
  return handleJsonResponse(response);
}
