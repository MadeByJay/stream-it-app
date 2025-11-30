CREATE TABLE IF NOT EXISTS user_list (
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    video_id INTEGER NOT NULL REFERENCES videos (id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, video_id)
);

CREATE TABLE IF NOT EXISTS watch_history (
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    video_id INTEGER NOT NULL REFERENCES videos (id) ON DELETE CASCADE,
    last_position_seconds INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, video_id)
);
