import './App.css';
import { Link, Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { VideoDetailPage } from './pages/VideoDetailPage';
import { PlayerPage } from './pages/PlayerPage';
import { RequireAuth } from './auth/RequireAuth';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { useAuth } from './auth/AuthContext';
import { RequireAdmin } from './auth/RequireAdmin';
import { AdminVideoListPage } from './pages/admin/AdminVideoListPage';
import { AdminVideoFormPage } from './pages/admin/AdminVideoFormPage';

function App() {
  const { user, logout } = useAuth();

  return (
    <div className="app-root">
      <header className="app-header">
        <Link to="/" className="app-logo">
          StreamIt
        </Link>

        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          {user && user.isAdmin && (
            <Link to="/admin/videos" style={{ fontSize: '0.9rem' }}>
              Admin
            </Link>
          )}

          {user ? (
            <>
              <span style={{ fontSize: '0.9rem' }}>{user.email}</span>
              <button
                type="button"
                onClick={logout}
                style={{
                  padding: '0.25rem 0.8rem',
                  borderRadius: '999px',
                  border: 'none',
                  backgroundColor: '#333',
                  color: '#fff',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                Sign out
              </button>
            </>
          ) : (
            <Link to="/login" style={{ fontSize: '0.9rem' }}>
              Sign In
            </Link>
          )}
        </div>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/video/:videoId" element={<VideoDetailPage />} />
          <Route
            path="/watch/:videoId"
            element={
              <RequireAuth>
                <PlayerPage />
              </RequireAuth>
            }
          />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/admin/videos"
            element={
              <RequireAdmin>
                <AdminVideoListPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/videos/new"
            element={
              <RequireAdmin>
                <AdminVideoFormPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/videos/:videoId/edit"
            element={
              <RequireAdmin>
                <AdminVideoFormPage />
              </RequireAdmin>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
