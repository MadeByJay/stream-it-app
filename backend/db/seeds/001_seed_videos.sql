-- db/seeds/001_seed_videos.sql

INSERT INTO genres (name)
VALUES ('Action'), ('Drama'), ('Comedy')
ON CONFLICT (name) DO NOTHING;

INSERT INTO videos (
    title, description, thumbnail_url, video_path, release_year, age_rating
)
VALUES
(
    'Sample Action Movie',
    'An example action movie used for local testing.',
    '/static/thumbnails/sample-action.jpg',
    'sample.mp4',
    2023,
    'PG-13'
),
(
    'Sample Drama Movie',
    'An example drama movie used for local testing.',
    '/static/thumbnails/sample-drama.jpg',
    'sample.mp4',
    2022,
    'PG-13'
),
(
    'Sample Comedy Movie',
    'An example comedy movie used for local testing.',
    '/static/thumbnails/sample-comedy.jpg',
    'sample.mp4',
    2021,
    'PG'
);

-- Link the seeded videos to genres (simple example)
INSERT INTO video_genres (video_id, genre_id)
SELECT
    v.id,
    g.id
FROM videos v
JOIN genres g
    ON (
        (v.title LIKE 'Sample Action Movie' AND g.name = 'Action')
        OR (v.title LIKE 'Sample Drama Movie' AND g.name = 'Drama')
        OR (v.title LIKE 'Sample Comedy Movie' AND g.name = 'Comedy')
    )
ON CONFLICT DO NOTHING;
