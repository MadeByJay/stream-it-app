import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import type { AdminVideo } from '../../types/video';
import {
  deleteAdminVideo,
  fetchAdminVideoList,
} from '../../api/adminVideosApi';

export function AdminVideoListPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [videoList, setVideoList] = useState<AdminVideo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDeletingIdentifier, setIsDeletingIdentifier] = useState<
    number | null
  >(null);

  useEffect(() => {
    if (!user || !token) {
      setIsLoading(false);
      setErrorMessage('You must be logged in as an admin to view this page.');
      return;
    }

    async function loadAdminVideos() {
      try {
        setIsLoading(true);
        const adminVideos = await fetchAdminVideoList(token!);
        setVideoList(adminVideos);
        setErrorMessage(null);
      } catch (error) {
        console.error('Failed to fetch admin videos', error);
        setErrorMessage('Failed to load videos.');
      } finally {
        setIsLoading(false);
      }
    }

    loadAdminVideos();
  }, [user, token]);

  async function handleDelete(videoIdentifier: number) {
    if (!token) {
      return;
    }

    const confirmation = window.confirm(
      'Are you sure you want to delete this video?',
    );
    if (!confirmation) {
      return;
    }

    try {
      setIsDeletingIdentifier(videoIdentifier);
      await deleteAdminVideo(token, videoIdentifier);
      setVideoList((previousList) =>
        previousList.filter((video) => video.id !== videoIdentifier),
      );
    } catch (error) {
      console.error('Failed to delete video', error);
      alert('Failed to delete video. Check console for details.');
    } finally {
      setIsDeletingIdentifier(null);
    }
  }

  if (isLoading) {
    return <div>Loading admin videos...</div>;
  }

  if (errorMessage) {
    return <div>{errorMessage}</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2>Admin · Videos</h2>
        <button
          type="button"
          className="admin-primary-button"
          onClick={() => navigate('/admin/videos/new')}
        >
          + New Video
        </button>
      </div>

      {videoList.length === 0 ? (
        <div>No videos found.</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Path</th>
              <th>Year</th>
              <th>Rating</th>
              <th>Genres</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {videoList.map((video) => (
              <tr key={video.id}>
                <td>{video.id}</td>
                <td>{video.title}</td>
                <td className="admin-table-path-cell">{video.videoPath}</td>
                <td>{video.releaseYear ?? '-'}</td>
                <td>{video.ageRating ?? '-'}</td>
                <td>{video.genres.join(', ')}</td>
                <td className="admin-table-actions-cell">
                  <Link
                    to={`/admin/videos/${video.id}/edit`}
                    className="admin-link-button"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="admin-danger-button"
                    onClick={() => handleDelete(video.id)}
                    disabled={isDeletingIdentifier === video.id}
                  >
                    {isDeletingIdentifier === video.id
                      ? 'Deleting...'
                      : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
