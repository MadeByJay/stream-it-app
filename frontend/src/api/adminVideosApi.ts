import type { AdminVideo } from '../types/video';

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

export async function fetchAdminVideoList(
  token: string,
): Promise<AdminVideo[]> {
  const response = await fetch('/api/admin/videos', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleJsonResponse<AdminVideo[]>(response);
}

export async function fetchAdminVideoDetail(
  token: string,
  videoIdentifier: number,
): Promise<AdminVideo> {
  const response = await fetch(`/api/admin/videos/${videoIdentifier}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleJsonResponse<AdminVideo>(response);
}

export async function createAdminVideo(
  token: string,
  payload: {
    title: string;
    description?: string | null;
    thumbnailUrl?: string | null;
    videoPath: string;
    releaseYear?: number | null;
    ageRating?: string | null;
    genreIdentifiers?: number[];
  },
): Promise<AdminVideo> {
  const response = await fetch('/api/admin/videos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: payload.title,
      description: payload.description,
      thumbnailUrl: payload.thumbnailUrl,
      videoPath: payload.videoPath,
      releaseYear: payload.releaseYear,
      ageRating: payload.ageRating,
      genreIds: payload.genreIdentifiers,
    }),
  });
  return handleJsonResponse<AdminVideo>(response);
}

export async function updateAdminVideo(
  token: string,
  videoIdentifier: number,
  payload: {
    title?: string;
    description?: string | null;
    thumbnailUrl?: string | null;
    videoPath?: string;
    releaseYear?: number | null;
    ageRating?: string | null;
    genreIdentifiers?: number[];
  },
): Promise<AdminVideo> {
  const response = await fetch(`/api/admin/videos/${videoIdentifier}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: payload.title,
      description: payload.description,
      thumbnailUrl: payload.thumbnailUrl,
      videoPath: payload.videoPath,
      releaseYear: payload.releaseYear,
      ageRating: payload.ageRating,
      genreIds: payload.genreIdentifiers,
    }),
  });
  return handleJsonResponse<AdminVideo>(response);
}

export async function deleteAdminVideo(
  token: string,
  videoIdentifier: number,
): Promise<void> {
  const response = await fetch(`/api/admin/videos/${videoIdentifier}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok && response.status !== 204) {
    const errorBody = await response.text();
    throw new Error(
      `Delete failed with status ${response.status}: ${errorBody || response.statusText}`,
    );
  }
}
export async function uploadAdminVideoFile(
  token: string,
  file: File,
): Promise<{ videoPath: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/admin/videos/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      // Note: do NOT set Content-Type manually; browser will set correct multipart boundary
    },
    body: formData,
  });

  return handleJsonResponse<{ videoPath: string }>(response);
}
