import './App.css';
import { Link, Route, Routes } from 'react-router-dom';
import { HomePage } from './components/HomePage';
import { VideoDetailPage } from './pages/VideoDetailPage';
import { PlayerPage } from './pages/PlayerPage';

function App() {
  return (
    <div className="app-root">
      <header className="app-header">
        <Link to="/" className="app-logo">
          MiniFlix
        </Link>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/video/:videoId" element={<VideoDetailPage />} />
          <Route path="/watch/:videoId" element={<PlayerPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
