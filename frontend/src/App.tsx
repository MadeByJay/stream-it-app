import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import { Link, Route, Routes } from 'react-router-dom';
import { HomePage } from './components/HomePage';

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
          {/* <Route path="/video/:videoId" /> */}
          {/* <Route path="/watch/:videoId" /> */}
        </Routes>
      </main>
    </div>
  );
}

export default App;
